import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const redisMocks = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  setEx: vi.fn(),
  del: vi.fn()
}));

const envMock = vi.hoisted(() => ({ REDIS_URL: 'redis://localhost:6379' as string | undefined }));

vi.mock('@cio/core/config/env', () => ({ env: envMock }));

vi.mock('@cio/core/utils/redis/redis', () => ({
  redis: redisMocks,
  logRedisUnavailableOnce: vi.fn()
}));

import { cachedRead } from '@api/utils/redis/cached-read';

const KEY = 'public-api:analytics:traffic:org-1:30';
const CACHED = { data: { views: 1 }, generatedAt: '2026-09-27T09:00:00.000Z' };

describe('cachedRead', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    envMock.REDIS_URL = 'redis://localhost:6379';
    redisMocks.get.mockResolvedValue(null);
    redisMocks.set.mockResolvedValue('OK');
    redisMocks.setEx.mockResolvedValue('OK');
    redisMocks.del.mockResolvedValue(1);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns a cached entry without computing', async () => {
    redisMocks.get.mockResolvedValue(JSON.stringify(CACHED));
    const compute = vi.fn();

    await expect(cachedRead(KEY, 600, compute)).resolves.toEqual(CACHED);
    expect(compute).not.toHaveBeenCalled();
  });

  it('on a miss, takes the lock, computes once, stores the entry with its TTL, and releases the lock', async () => {
    const compute = vi.fn().mockResolvedValue({ views: 2 });

    const entry = await cachedRead(KEY, 600, compute);

    expect(entry.data).toEqual({ views: 2 });
    expect(Date.parse(entry.generatedAt)).not.toBeNaN();
    expect(redisMocks.set).toHaveBeenCalledWith(`${KEY}:lock`, '1', { NX: true, EX: 30 });
    expect(redisMocks.setEx).toHaveBeenCalledWith(KEY, 600, JSON.stringify(entry));
    expect(redisMocks.del).toHaveBeenCalledWith(`${KEY}:lock`);
  });

  it('releases the lock when compute throws', async () => {
    await expect(cachedRead(KEY, 600, () => Promise.reject(new Error('db down')))).rejects.toThrow('db down');
    expect(redisMocks.del).toHaveBeenCalledWith(`${KEY}:lock`);
    expect(redisMocks.setEx).not.toHaveBeenCalled();
  });

  it("waits for another request's result instead of computing when the lock is held", async () => {
    redisMocks.set.mockResolvedValue(null);
    redisMocks.get
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(JSON.stringify(CACHED));
    const compute = vi.fn();

    await expect(cachedRead(KEY, 600, compute)).resolves.toEqual(CACHED);
    expect(compute).not.toHaveBeenCalled();
    expect(redisMocks.del).not.toHaveBeenCalled();
  });

  it('computes anyway once the wait runs out, so a stuck lock never blocks reads', async () => {
    vi.useFakeTimers();
    redisMocks.set.mockResolvedValue(null);
    const compute = vi.fn().mockResolvedValue({ views: 3 });

    const pending = cachedRead(KEY, 600, compute);
    await vi.advanceTimersByTimeAsync(2_000);

    await expect(pending).resolves.toMatchObject({ data: { views: 3 } });
    expect(compute).toHaveBeenCalledTimes(1);
    expect(redisMocks.del).not.toHaveBeenCalled();
  });

  it('goes straight to the database when Redis errors, without waiting', async () => {
    redisMocks.get.mockRejectedValue(new Error('ECONNREFUSED'));
    redisMocks.set.mockRejectedValue(new Error('ECONNREFUSED'));
    redisMocks.setEx.mockRejectedValue(new Error('ECONNREFUSED'));
    const compute = vi.fn().mockResolvedValue({ views: 4 });

    await expect(cachedRead(KEY, 600, compute)).resolves.toMatchObject({ data: { views: 4 } });
    expect(redisMocks.get).toHaveBeenCalledTimes(1);
  });

  it('just computes when Redis is not configured', async () => {
    envMock.REDIS_URL = undefined;
    const compute = vi.fn().mockResolvedValue({ views: 5 });

    await expect(cachedRead(KEY, 600, compute)).resolves.toMatchObject({ data: { views: 5 } });
    expect(redisMocks.get).not.toHaveBeenCalled();
  });
});
