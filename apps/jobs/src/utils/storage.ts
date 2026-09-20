import { GetObjectCommand, HeadObjectCommand, NotFound, PutObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'node:stream';
import { createWriteStream } from 'node:fs';
import { mkdir, readdir, readFile, unlink } from 'node:fs/promises';
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

const HLS_CONTENT_TYPES: Record<string, string> = {
  '.m3u8': 'application/vnd.apple.mpegurl',
  '.ts': 'video/mp2t'
};

async function listFilesRecursive(dir: string, base = dir): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFilesRecursive(full, base)));
    } else {
      files.push(path.relative(base, full).split(path.sep).join('/'));
    }
  }

  return files;
}

export async function uploadHlsDirectory(
  bucket: string,
  localDir: string,
  keyPrefix: string,
  concurrency = 6
): Promise<string[]> {
  const files = await listFilesRecursive(localDir);
  const master = files.filter((file) => file === 'master.m3u8');
  const rest = files.filter((file) => file !== 'master.m3u8');

  const uploadOne = async (relativePath: string) => {
    const contentType = HLS_CONTENT_TYPES[path.extname(relativePath)] ?? 'application/octet-stream';
    await uploadFileToBucket(bucket, `${keyPrefix}/${relativePath}`, path.join(localDir, relativePath), contentType);
  };

  let next = 0;
  const workers = Array.from({ length: Math.min(concurrency, rest.length) }, async () => {
    while (next < rest.length) {
      const current = rest[next++];
      await uploadOne(current);
    }
  });
  await Promise.all(workers);

  for (const file of master) {
    await uploadOne(file);
  }

  return files;
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
