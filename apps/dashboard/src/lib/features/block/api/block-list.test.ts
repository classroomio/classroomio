import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const snackbarError = vi.hoisted(() => vi.fn());
vi.mock('$features/ui/snackbar/store', () => ({ snackbar: { error: snackbarError } }));
vi.mock('$lib/utils/functions/translations', () => ({
  t: { get: (key: string, values?: Record<string, string>) => `${key}:${values?.reason ?? ''}` }
}));

import { BlockListApi } from './block-list.svelte';
import type { BlockOwner, BlockRecord } from '../utils/types';

function createRecord(id: string, data: Record<string, unknown>): BlockRecord {
  return {
    id,
    placementId: `placement-${id}`,
    type: 'image',
    data,
    version: 1,
    contents: {}
  } as unknown as BlockRecord;
}

function createVersionedOwner(initial: BlockRecord[]) {
  const server = new Map(initial.map((record) => [record.id, structuredClone(record)]));
  const dataWrites: Record<string, unknown>[] = [];

  const owner: BlockOwner = {
    list: vi.fn(async () => [...server.values()].map((record) => structuredClone(record))),
    create: vi.fn(async () => null),
    updateData: vi.fn(async (blockId, data, expectedVersion) => {
      const record = server.get(blockId);
      if (!record) return { status: 'failed' as const };
      if (record.version !== expectedVersion) return { status: 'conflict' as const, reason: 'Changed by someone else' };

      dataWrites.push(data);
      record.data = data as BlockRecord['data'];
      record.version += 1;

      return { status: 'saved' as const, record: structuredClone(record) };
    }),
    updateContent: vi.fn(async (blockId, locale, content, expectedVersion) => {
      const record = server.get(blockId);
      if (!record || record.version !== expectedVersion) return null;

      record.contents = { ...record.contents, [locale]: content };
      record.version += 1;

      return structuredClone(record);
    }),
    updatePlacement: vi.fn(async () => null),
    move: vi.fn(async () => null),
    remove: vi.fn(async () => true)
  };

  return { owner, server, dataWrites };
}

describe('BlockListApi data saves', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    snackbarError.mockClear();
  });

  it('sends one request for a burst of data edits', async () => {
    const { owner, dataWrites } = createVersionedOwner([createRecord('a', { url: 'https://a.test/1.png' })]);
    const api = new BlockListApi();
    await api.load(owner);

    api.setData('a', { url: 'https://a.test/2.png' });
    api.setData('a', { url: 'https://a.test/3.png' });
    api.setData('a', { url: 'https://a.test/4.png' });
    expect(owner.updateData).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(500);

    expect(dataWrites).toEqual([{ url: 'https://a.test/4.png' }]);
    expect(api.blocks[0].version).toBe(2);
  });

  it('keeps the local edit while a save is in flight and saves the newer value next', async () => {
    const { owner, server } = createVersionedOwner([createRecord('a', { url: 'https://a.test/1.png' })]);
    const api = new BlockListApi();
    await api.load(owner);

    api.setData('a', { url: 'https://a.test/2.png' });
    const firstSave = api.flush();
    api.setData('a', { url: 'https://a.test/3.png' });
    await firstSave;
    await api.flush();

    expect(server.get('a')?.data).toEqual({ url: 'https://a.test/3.png' });
    expect(api.blocks[0].data).toEqual({ url: 'https://a.test/3.png' });
  });

  it('retries a stale-version save once after reloading, keeping the local data', async () => {
    const { owner, server } = createVersionedOwner([createRecord('a', { url: 'https://a.test/1.png' })]);
    const api = new BlockListApi();
    await api.load(owner);

    const serverRecord = server.get('a');
    if (serverRecord) serverRecord.version = 5;

    await api.updateData('a', { url: 'https://a.test/2.png' });

    expect(owner.list).toHaveBeenCalledTimes(2);
    expect(server.get('a')?.data).toEqual({ url: 'https://a.test/2.png' });
    expect(api.blocks[0].data).toEqual({ url: 'https://a.test/2.png' });
    expect(api.blocks[0].version).toBe(6);
    expect(snackbarError).not.toHaveBeenCalled();
  });

  it('restores the saved data without retrying when a save fails for a reason other than a conflict', async () => {
    const { owner, server } = createVersionedOwner([createRecord('a', { url: 'https://a.test/1.png' })]);
    owner.updateData = vi.fn(async () => ({ status: 'failed' as const }));
    const api = new BlockListApi();
    await api.load(owner);

    await api.updateData('a', { url: 'https://a.test/2.png' });

    expect(owner.updateData).toHaveBeenCalledTimes(1);
    expect(server.get('a')?.data).toEqual({ url: 'https://a.test/1.png' });
    expect(api.blocks[0].data).toEqual({ url: 'https://a.test/1.png' });

    await api.flush();
    expect(owner.updateData).toHaveBeenCalledTimes(1);
  });

  it('restores the saved data when a conflict repeats after reloading', async () => {
    const { owner, server } = createVersionedOwner([createRecord('a', { url: 'https://a.test/1.png' })]);
    owner.updateData = vi.fn(async () => ({ status: 'conflict' as const, reason: 'Changed by someone else' }));
    const api = new BlockListApi();
    await api.load(owner);

    await api.updateData('a', { url: 'https://a.test/2.png' });

    expect(owner.updateData).toHaveBeenCalledTimes(2);
    expect(server.get('a')?.data).toEqual({ url: 'https://a.test/1.png' });
    expect(api.blocks[0].data).toEqual({ url: 'https://a.test/1.png' });
    expect(snackbarError).toHaveBeenCalledWith(
      'course.navItem.lessons.materials.blocks.save_failed:Changed by someone else'
    );
  });

  it('saves text and data edits to the same block in sequence without a version conflict', async () => {
    const { owner, server } = createVersionedOwner([createRecord('a', { url: 'https://a.test/1.png' })]);
    const api = new BlockListApi();
    await api.load(owner);

    api.setContent('a', 'en', '<p>Hello</p>');
    api.setData('a', { url: 'https://a.test/2.png' });
    await api.flush();

    expect(owner.list).toHaveBeenCalledTimes(1);
    expect(server.get('a')?.contents.en).toBe('<p>Hello</p>');
    expect(server.get('a')?.data).toEqual({ url: 'https://a.test/2.png' });
    expect(server.get('a')?.version).toBe(3);
  });
});
