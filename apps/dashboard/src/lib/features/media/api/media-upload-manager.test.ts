import { describe, expect, it, vi } from 'vitest';

vi.mock('./media-file-transfer', () => ({
  encodesVideoInBrowser: () => true,
  uploadMediaFile: vi.fn()
}));

import { MediaUploadManager } from './media-upload-manager.svelte';

const LIMITS = { video: 1024 * 1024 * 1024, document: 5 * 1024 * 1024 };

function videoFile(name: string) {
  return new File(['x'], name, { type: 'video/mp4' });
}

function controlledTransfer() {
  const resolvers: (() => void)[] = [];
  const transfer = vi.fn(
    () =>
      new Promise<void>((resolve) => {
        resolvers.push(resolve);
      })
  );

  return { transfer, resolvers };
}

describe('MediaUploadManager encode cap', () => {
  it('starts two videos and holds the rest until one finishes', async () => {
    const { transfer, resolvers } = controlledTransfer();
    const manager = new MediaUploadManager(transfer);

    manager.add([videoFile('a.mp4'), videoFile('b.mp4'), videoFile('c.mp4')], LIMITS);

    expect(transfer).toHaveBeenCalledTimes(2);

    resolvers[0]();
    await vi.waitFor(() => expect(transfer).toHaveBeenCalledTimes(3));
  });

  it('keeps a removed video holding its slot until its transfer has stopped', async () => {
    const { transfer, resolvers } = controlledTransfer();
    const manager = new MediaUploadManager(transfer);

    manager.add([videoFile('a.mp4'), videoFile('b.mp4'), videoFile('c.mp4')], LIMITS);
    manager.remove(manager.items[0].id);

    expect(transfer).toHaveBeenCalledTimes(2);

    resolvers[0]();
    await vi.waitFor(() => expect(transfer).toHaveBeenCalledTimes(3));
  });
});
