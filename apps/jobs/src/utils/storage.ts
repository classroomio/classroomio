import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
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
