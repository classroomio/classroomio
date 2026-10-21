import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  NotFound,
  PutObjectCommand
} from '@aws-sdk/client-s3';
import { Readable } from 'node:stream';
import { createWriteStream } from 'node:fs';
import { mkdir, readFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';

import { getS3Client, getStorageConfig } from '../config/storage';

/**
 * Streams an S3 object to a temp file on disk and returns the absolute path.
 * Workers prefer disk over buffers so ffmpeg can seek without holding the
 * whole video in RAM.
 */
export async function objectExists(bucket: string, key: string): Promise<boolean> {
  try {
    await getS3Client().send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch (error) {
    if (error instanceof NotFound || (error as { name?: string }).name === 'NotFound') {
      return false;
    }

    const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
    if (status === 404) {
      return false;
    }

    throw error;
  }
}

export async function downloadObjectToTempFile(bucket: string, key: string, fileNameHint?: string): Promise<string> {
  const dir = path.join(tmpdir(), 'cio-jobs');
  await mkdir(dir, { recursive: true });

  const safeName = fileNameHint?.replace(/[^a-zA-Z0-9._-]/g, '_') ?? 'media';
  const localPath = path.join(dir, `${Date.now()}_${process.pid}_${safeName}`);

  const response = await getS3Client().send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!response.Body) {
    throw new Error(`S3 object ${bucket}/${key} returned no body`);
  }

  const body = response.Body as Readable;
  await pipeline(body, createWriteStream(localPath));

  return localPath;
}

export async function uploadFileToBucket(
  bucket: string,
  key: string,
  localPath: string,
  contentType: string,
  cacheControl?: string
): Promise<void> {
  const buffer = await readFile(localPath);
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: cacheControl
    })
  );
}

export async function uploadBufferToBucket(
  bucket: string,
  key: string,
  buffer: Buffer,
  contentType: string,
  cacheControl?: string
): Promise<void> {
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: cacheControl
    })
  );
}

/**
 * Streams a local file to object storage without reading it into memory,
 * so large extracted package files keep worker memory flat.
 */
export async function uploadStreamToBucket(
  bucket: string,
  key: string,
  localPath: string,
  contentType: string,
  cacheControl?: string
): Promise<void> {
  const { createReadStream } = await import('node:fs');

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: createReadStream(localPath),
      ContentType: contentType,
      CacheControl: cacheControl
    })
  );
}

export async function deleteObjectFromBucket(bucket: string, key: string): Promise<void> {
  await getS3Client().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export async function deletePackageStoragePrefix(bucket: string, contentPrefix: string): Promise<void> {
  if (!contentPrefix) return;

  try {
    let continuationToken: string | undefined;
    do {
      const page = await getS3Client().send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: `${contentPrefix}/`,
          ContinuationToken: continuationToken
        })
      );
      const keys = (page.Contents ?? []).map((entry) => entry.Key).filter((key): key is string => Boolean(key));
      if (keys.length > 0) {
        await getS3Client().send(
          new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true }
          })
        );
      }
      continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
    } while (continuationToken);

    await getS3Client()
      .send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: `${contentPrefix}.index.json`
        })
      )
      .catch(() => {});
  } catch {
    // best-effort cleanup of storage prefix
  }
}

export async function safeUnlink(filePath: string | undefined | null): Promise<void> {
  if (!filePath) return;

  try {
    await unlink(filePath);
  } catch {
    // best-effort cleanup
  }
}

export function videosBucket(): string {
  return getStorageConfig().bucketVideos;
}

export function mediaBucket(): string {
  return getStorageConfig().bucketMedia;
}

export function scormBucket(): string {
  return getStorageConfig().bucketScorm;
}
