import { createWriteStream } from 'node:fs';
import { readFile, readdir, stat } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';

const MAX_SOURCE_BYTES = Number.parseInt(process.env.CIO_MAX_SOURCE_BYTES ?? '', 10) || 2 * 1024 * 1024 * 1024;

/**
 * Streams the presigned source to disk.
 *
 * Streamed rather than buffered because the source can be gigabytes, and capped
 * while streaming rather than trusting `Content-Length`, which the sender
 * controls.
 */
export async function downloadSource(sourceUrl: string, destination: string): Promise<number> {
  const response = await fetch(sourceUrl);
  if (!response.ok || !response.body) {
    throw new Error(`Could not download the source (${response.status})`);
  }

  const declared = Number.parseInt(response.headers.get('content-length') ?? '', 10);
  if (Number.isFinite(declared) && declared > MAX_SOURCE_BYTES) {
    throw new Error(`Source is ${declared} bytes, over the ${MAX_SOURCE_BYTES} byte limit`);
  }

  let written = 0;
  const counter = new Readable({ read() {} });
  const reader = response.body.getReader();

  void (async () => {
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;

        written += value.byteLength;
        if (written > MAX_SOURCE_BYTES) {
          counter.destroy(new Error(`Source exceeded the ${MAX_SOURCE_BYTES} byte limit while downloading`));
          return;
        }

        counter.push(Buffer.from(value));
      }

      counter.push(null);
    } catch (error) {
      counter.destroy(error as Error);
    }
  })();

  await pipeline(counter, createWriteStream(destination));

  return written;
}

/** Every produced file, as paths relative to the output directory. */
export async function listOutputs(directory: string, base = directory): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const full = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await listOutputs(full, base)));
    } else {
      files.push(path.relative(base, full).split(path.sep).join('/'));
    }
  }

  return files;
}

const CONTENT_TYPES: Record<string, string> = {
  '.m3u8': 'application/vnd.apple.mpegurl',
  '.ts': 'video/mp2t'
};

function contentTypeFor(relativePath: string): string {
  return CONTENT_TYPES[path.extname(relativePath).toLowerCase()] ?? 'application/octet-stream';
}

/**
 * Uploads outputs to their presigned URLs, segments first and playlists last.
 *
 * Ordering matters: a playlist that lands before its segments would let a player
 * request objects that do not exist yet. Bounded concurrency keeps a long ladder
 * from opening hundreds of sockets at once.
 */
export async function uploadOutputs(input: {
  outputDir: string;
  urls: Record<string, string>;
  paths: string[];
  concurrency?: number;
}): Promise<void> {
  const { outputDir, urls, paths } = input;
  const concurrency = input.concurrency ?? 8;

  const playlists = paths.filter((file) => file.endsWith('.m3u8'));
  const segments = paths.filter((file) => !file.endsWith('.m3u8'));

  const putOne = async (relativePath: string) => {
    const url = urls[relativePath];
    if (!url) {
      throw new Error(`No presigned URL was issued for ${relativePath}`);
    }

    const body = await readFile(path.join(outputDir, relativePath));
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'content-type': contentTypeFor(relativePath) },
      body
    });

    if (!response.ok) {
      throw new Error(`Upload of ${relativePath} failed (${response.status})`);
    }
  };

  const runPool = async (files: string[]) => {
    let next = 0;
    const workers = Array.from({ length: Math.min(concurrency, files.length) }, async () => {
      while (next < files.length) {
        const file = files[next++];
        if (file) await putOne(file);
      }
    });

    await Promise.all(workers);
  };

  await runPool(segments);
  await runPool(playlists);
}

export async function fileSize(filePath: string): Promise<number> {
  return (await stat(filePath)).size;
}
