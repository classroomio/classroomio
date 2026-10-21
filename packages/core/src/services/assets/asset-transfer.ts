import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

import { CopyObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { nanoid } from 'nanoid';

import type { DbOrTxClient } from '@cio/db/drizzle';
import { createAsset } from '@cio/db/queries/assets';
import type { TAsset } from '@cio/db/types';
import type { TAssetStorageCleanupPayload } from '@cio/jobs';

import { getS3Client, getStorageConfig } from '../../config/storage';
import { purgeAssetStorage } from './assets';

export type TAssetTransfer = {
  asset: TAsset;
  /** Source → copy pairs (asset id, storage key) to rewrite in content that pointed at the source. */
  replacements: [string, string][];
};

type TransferScope = {
  copied: TAssetStorageCleanupPayload[];
  transfers: Map<string, TAssetTransfer>;
};

const transferScope = new AsyncLocalStorage<TransferScope>();

function replaceAll(value: string, from: string, to: string) {
  return value.split(from).join(to);
}

function rewriteJson<T>(value: T, from: string, to: string): T {
  return JSON.parse(replaceAll(JSON.stringify(value), from, to)) as T;
}

async function copyObject(bucket: string, sourceKey: string, targetKey: string) {
  await getS3Client().send(
    new CopyObjectCommand({ Bucket: bucket, Key: targetKey, CopySource: encodeURI(`${bucket}/${sourceKey}`) })
  );
}

async function copyPrefix(bucket: string, sourcePrefix: string, targetPrefix: string) {
  let continuationToken: string | undefined;
  do {
    const listed = await getS3Client().send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: sourcePrefix, ContinuationToken: continuationToken })
    );
    for (const entry of listed.Contents ?? []) {
      if (!entry.Key) continue;

      const targetKey = `${targetPrefix}${entry.Key.slice(sourcePrefix.length)}`;
      await copyObject(bucket, entry.Key, targetKey);
    }
    continuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined;
  } while (continuationToken);
}

function rawFileBucket(asset: TAsset) {
  const config = getStorageConfig();

  return asset.kind === 'document' ? config.bucketDocuments : config.bucketVideos;
}

/**
 * Copies an uploaded asset into `organizationId` as a new asset that shares no
 * storage with the source: the raw file gets a key prefixed with the target org,
 * and every per-asset folder (HLS renditions, thumbnails, audio, transcripts) is
 * copied under the new id. Returns the new asset and the id/key pairs to rewrite
 * in copied content. Inside `withAssetStorageRollback`, each source asset is
 * copied once per operation and the copied files are purged if the operation fails.
 */
export async function transferUploadedAsset(
  asset: TAsset,
  organizationId: string,
  profileId: string,
  dbClient: DbOrTxClient
): Promise<TAssetTransfer> {
  const scope = transferScope.getStore();
  const scopeKey = `${asset.id}:${organizationId}`;
  const earlier = scope?.transfers.get(scopeKey);
  if (earlier) return earlier;

  const config = getStorageConfig();
  const assetId = randomUUID();
  const replacements: [string, string][] = [[asset.id, assetId]];
  const cleanup: TAssetStorageCleanupPayload = {
    assetId,
    organizationId,
    prefixes: [
      { bucket: config.bucketVideos, prefix: `${assetId}/` },
      { bucket: config.bucketMedia, prefix: `thumbnails/${assetId}/` },
      { bucket: config.bucketMedia, prefix: `audio/${assetId}/` },
      { bucket: config.bucketMedia, prefix: `transcripts/${assetId}/` }
    ],
    keys: []
  };
  scope?.copied.push(cleanup);

  let storageKey: string | null = null;
  if (asset.storageKey) {
    storageKey = `${organizationId}/${nanoid()}-${path.basename(asset.storageKey)}`;
    const bucket = rawFileBucket(asset);
    cleanup.keys.push({ bucket, key: storageKey });
    await copyObject(bucket, asset.storageKey, storageKey);
    replacements.push([asset.storageKey, storageKey]);
  }

  for (const { bucket, prefix } of cleanup.prefixes) {
    const sourcePrefix = replaceAll(prefix, assetId, asset.id);
    await copyPrefix(bucket, sourcePrefix, prefix);
  }

  const hlsManifestKey = asset.hlsManifestKey ? replaceAll(asset.hlsManifestKey, asset.id, assetId) : null;
  const hlsAudioKey = asset.hlsAudioKey ? replaceAll(asset.hlsAudioKey, asset.id, assetId) : null;
  const thumbnailUrl = asset.thumbnailUrl ? replaceAll(asset.thumbnailUrl, asset.id, assetId) : null;
  const thumbnailCandidates = asset.thumbnailCandidates.map((candidate) => replaceAll(candidate, asset.id, assetId));
  const metadata = rewriteJson(asset.metadata ?? {}, asset.id, assetId);

  const created = await createAsset(
    {
      id: assetId,
      organizationId,
      kind: asset.kind,
      provider: asset.provider,
      storageProvider: asset.storageProvider,
      storageKey,
      hlsManifestKey,
      hlsAudioKey,
      sourceUrl: asset.sourceUrl,
      mimeType: asset.mimeType,
      byteSize: asset.byteSize,
      checksum: asset.checksum,
      title: asset.title,
      description: asset.description,
      thumbnailUrl,
      thumbnailCandidates,
      durationSeconds: asset.durationSeconds,
      aspectRatio: asset.aspectRatio,
      isExternal: asset.isExternal,
      status: asset.status,
      metadata,
      createdByProfileId: profileId
    },
    dbClient
  );
  const transfer = { asset: created, replacements };
  scope?.transfers.set(scopeKey, transfer);

  return transfer;
}

/**
 * Runs `operation` (typically a DB transaction that copies content across orgs)
 * and, if it throws, purges any files `transferUploadedAsset` copied during it,
 * since object storage does not roll back with the transaction.
 */
export async function withAssetStorageRollback<T>(operation: () => Promise<T>): Promise<T> {
  const scope: TransferScope = { copied: [], transfers: new Map() };
  try {
    return await transferScope.run(scope, operation);
  } catch (error) {
    for (const payload of scope.copied) {
      await purgeAssetStorage(payload).catch((cleanupError) =>
        console.error('withAssetStorageRollback cleanup error:', cleanupError)
      );
    }
    throw error;
  }
}
