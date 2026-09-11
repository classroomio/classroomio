import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldBackfillVimeoAsset } from '../dist/services/assets/assets.js';

function createMockAsset(overrides = {}) {
  return {
    id: 'test-asset-id',
    organizationId: 'test-org-id',
    kind: 'video',
    provider: 'vimeo',
    storageProvider: 'external',
    storageKey: null,
    hlsManifestKey: null,
    hlsAudioKey: null,
    sourceUrl: 'https://vimeo.com/76979871',
    mimeType: null,
    byteSize: null,
    checksum: null,
    title: 'Custom Vimeo Title',
    description: null,
    thumbnailUrl: 'https://i.vimeocdn.com/video/123_640x360.jpg',
    thumbnailCandidates: [],
    durationSeconds: 120,
    aspectRatio: null,
    isExternal: true,
    status: 'active',
    metadata: {},
    createdByProfileId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  };
}

test('shouldBackfillVimeoAsset - complete Vimeo asset requires no backfill', () => {
  const asset = createMockAsset();
  assert.equal(shouldBackfillVimeoAsset(asset), false);
});

test('shouldBackfillVimeoAsset - non-Vimeo asset is ignored', () => {
  const asset = createMockAsset({
    provider: 'youtube',
    sourceUrl: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: null,
    durationSeconds: null
  });
  assert.equal(shouldBackfillVimeoAsset(asset), false);
});

test('shouldBackfillVimeoAsset - missing thumbnail triggers backfill', () => {
  const asset = createMockAsset({
    thumbnailUrl: null
  });
  assert.equal(shouldBackfillVimeoAsset(asset), true);
});

test('shouldBackfillVimeoAsset - missing duration triggers backfill', () => {
  const asset = createMockAsset({
    durationSeconds: null
  });
  assert.equal(shouldBackfillVimeoAsset(asset), true);
});

test('shouldBackfillVimeoAsset - generic or missing title triggers backfill', () => {
  const assetWithEmptyTitle = createMockAsset({ title: '' });
  assert.equal(shouldBackfillVimeoAsset(assetWithEmptyTitle), true);

  const assetWithVimeoTitle = createMockAsset({ title: 'Vimeo' });
  assert.equal(shouldBackfillVimeoAsset(assetWithVimeoTitle), true);

  const assetWithVimeoVideoTitle = createMockAsset({ title: 'Vimeo video' });
  assert.equal(shouldBackfillVimeoAsset(assetWithVimeoVideoTitle), true);

  const assetWithUrlAsTitle = createMockAsset({ title: 'https://vimeo.com/76979871' });
  assert.equal(shouldBackfillVimeoAsset(assetWithUrlAsTitle), true);
});

test('shouldBackfillVimeoAsset - enforces 5-minute cooldown on repeated attempts', () => {
  const now = Date.now();

  // Attempted 1 minute ago (within 5-minute cooldown)
  const assetInCooldown = createMockAsset({
    thumbnailUrl: null,
    metadata: { lastVimeoFetchAt: now - 60 * 1000 }
  });
  assert.equal(shouldBackfillVimeoAsset(assetInCooldown), false);

  // Attempted 6 minutes ago (past 5-minute cooldown)
  const assetPastCooldown = createMockAsset({
    thumbnailUrl: null,
    metadata: { lastVimeoFetchAt: now - 6 * 60 * 1000 }
  });
  assert.equal(shouldBackfillVimeoAsset(assetPastCooldown), true);
});
