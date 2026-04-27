#!/usr/bin/env tsx

/**
 * Upload built embed assets to Cloudflare R2 (S3-compatible), same bucket pattern as Storybook.
 *
 * Each widget gets its own prefix under `embeds/<widget>/` so future widgets stay isolated.
 *
 * @see packages/storybook/scripts/upload-storybook.ts
 */

import 'dotenv/config';

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { join, relative } from 'node:path';
import { readFileSync, readdirSync, statSync } from 'node:fs';

const BUCKET = 'assets';

const EMBED_WIDGET_TARGETS = [
  {
    buildDirName: 'question-type-picker',
    prefix: 'embeds/question-type-picker'
  },
  {
    buildDirName: 'course-widget',
    prefix: 'embeds/course-widget'
  }
] as const;

/** Cloudflare allows a limited number of URLs per purge request. */
const PURGE_URL_BATCH = 30;

const DEFAULT_CDN_BASE = 'https://assets.cdn.clsrio.com';

function normalizePublicBaseUrl(raw: string | undefined): string {
  const value = raw != null && raw.trim() !== '' ? raw.trim() : DEFAULT_CDN_BASE;
  const trimmed = value.replace(/\/$/, '');
  if (!trimmed.startsWith('https://')) {
    throw new Error('EMBED_CDN_BASE_URL must be an https URL (no trailing slash).');
  }
  return trimmed;
}

/**
 * Purge Cloudflare **edge cache** for public URLs that map to R2 objects.
 * R2 itself has no separate HTTP cache; purging fixes stale responses when the hostname is proxied through Cloudflare.
 */
async function purgeCloudflareCdnForUrls(urls: string[]): Promise<void> {
  if (process.env.EMBED_SKIP_CDN_PURGE === '1' || process.env.EMBED_SKIP_CDN_PURGE === 'true') {
    console.log('Skipping Cloudflare CDN purge (EMBED_SKIP_CDN_PURGE is set).');
    return;
  }

  const token = process.env.CLOUDFLARE_API_TOKEN;
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;

  if (!token || !zoneId) {
    console.log(
      'Skipping Cloudflare CDN cache purge. Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID to purge after upload.'
    );
    return;
  }

  if (urls.length === 0) {
    return;
  }

  const uniqueUrls = [...new Set(urls)];

  for (let i = 0; i < uniqueUrls.length; i += PURGE_URL_BATCH) {
    const batch = uniqueUrls.slice(i, i + PURGE_URL_BATCH);
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ files: batch })
    });

    const payload: unknown = await response.json().catch(() => ({}));
    const success =
      response.ok &&
      typeof payload === 'object' &&
      payload !== null &&
      'success' in payload &&
      (payload as { success?: boolean }).success === true;

    if (!success) {
      throw new Error(`Cloudflare CDN purge failed: ${response.status} ${JSON.stringify(payload)}`);
    }

    console.log(`Purged Cloudflare CDN cache for ${batch.length} URL(s).`);
  }
}

class EmbedsUploader {
  private s3Client: S3Client | null = null;
  private readonly buildRootDir: string;

  constructor() {
    this.buildRootDir = join(process.cwd(), 'dist');
    this.initializeS3Client();
  }

  private initializeS3Client(): void {
    const accessKey = process.env.CLOUDFLARE_ACCESS_KEY;
    const secretKey = process.env.CLOUDFLARE_SECRET_ACCESS_KEY;
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

    if (accessKey && secretKey && accountId) {
      this.s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: accessKey,
          secretAccessKey: secretKey
        }
      });
      console.log('S3 client initialized for Cloudflare R2');
    } else {
      throw new Error(
        'Missing Cloudflare R2 credentials (CLOUDFLARE_ACCESS_KEY, CLOUDFLARE_SECRET_ACCESS_KEY, CLOUDFLARE_ACCOUNT_ID)'
      );
    }
  }

  private getContentType(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const contentTypes: Record<string, string> = {
      html: 'text/html',
      js: 'application/javascript',
      mjs: 'application/javascript',
      json: 'application/json',
      css: 'text/css',
      map: 'application/json',
      txt: 'text/plain'
    };
    return contentTypes[ext || ''] || 'application/octet-stream';
  }

  private getCacheControl(filePath: string): string {
    if (filePath.endsWith('.html')) {
      return 'public, max-age=300';
    }
    if (filePath.match(/\.(js|mjs)$/)) {
      const baseName = filePath.split(/[/\\]/).pop() ?? filePath;
      // Stable bootstrap URL must revalidate quickly so new chunk hashes roll out after deploy.
      if (baseName === 'question-type-picker.js' || baseName === 'course-widget.js') {
        return 'public, max-age=300, must-revalidate';
      }
      return 'public, max-age=31536000, immutable';
    }
    if (filePath.endsWith('.css')) {
      return 'public, max-age=3600';
    }
    return 'public, max-age=3600';
  }

  private getAllFiles(dir: string, baseDir: string = dir): string[] {
    const files: string[] = [];
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = relative(baseDir, fullPath);

      if (entry.isDirectory()) {
        files.push(...this.getAllFiles(fullPath, baseDir));
      } else {
        files.push(relativePath);
      }
    }

    return files;
  }

  async uploadFile(targetPrefix: string, buildDir: string, relativePath: string): Promise<void> {
    if (!this.s3Client) {
      throw new Error('S3 client not initialized');
    }

    const fullPath = join(buildDir, relativePath);
    const content = readFileSync(fullPath);
    const contentType = this.getContentType(relativePath);
    const cacheControl = this.getCacheControl(relativePath);
    const normalizedRelativePath = relativePath.split('\\').join('/');
    const key = `${targetPrefix}/${normalizedRelativePath}`;
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: content,
      ContentType: contentType,
      CacheControl: cacheControl
    });

    await this.s3Client.send(command);
    console.log(`Uploaded: ${key}`);
  }

  async uploadAll(): Promise<void> {
    console.log('Uploading embeds to R2...');
    console.log(`Build root directory: ${this.buildRootDir}`);

    const purgeUrls: string[] = [];
    const publicBase = normalizePublicBaseUrl(process.env.EMBED_CDN_BASE_URL);
    const batchSize = 10;

    for (const target of EMBED_WIDGET_TARGETS) {
      const buildDir = join(this.buildRootDir, target.buildDirName);

      try {
        statSync(buildDir);
      } catch {
        throw new Error(`Build directory not found: ${buildDir}. Run pnpm build in apps/embeds first.`);
      }

      console.log(`Target prefix: ${target.prefix}`);

      const files = this.getAllFiles(buildDir);
      if (files.length === 0) {
        throw new Error(`No files found in ${buildDir}. Run pnpm build first.`);
      }

      console.log(`Found ${files.length} file(s) for ${target.buildDirName}`);

      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        await Promise.all(batch.map((file) => this.uploadFile(target.prefix, buildDir, file)));
        console.log(
          `Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(files.length / batchSize)} for ${target.buildDirName}`
        );
      }

      purgeUrls.push(
        ...files.map((relativePath) => `${publicBase}/${target.prefix}/${relativePath.split('\\').join('/')}`)
      );
    }

    console.log('Embeds upload completed.');
    await purgeCloudflareCdnForUrls(purgeUrls);
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: tsx scripts/upload-embeds.ts

Uploads widget-specific embed builds under:
${EMBED_WIDGET_TARGETS.map((target) => `  - dist/${target.buildDirName} -> ${target.prefix}`).join('\n')}

Environment (same as Storybook R2 upload):
  CLOUDFLARE_ACCESS_KEY
  CLOUDFLARE_SECRET_ACCESS_KEY
  CLOUDFLARE_ACCOUNT_ID

Optional — purge Cloudflare CDN cache for the public asset host after upload (not R2; use when the domain is orange-clouded):
  CLOUDFLARE_API_TOKEN   (Zone → Cache Purge → Purge)
  CLOUDFLARE_ZONE_ID
  EMBED_CDN_BASE_URL     (default ${DEFAULT_CDN_BASE})
  EMBED_SKIP_CDN_PURGE=1 to skip purge

Bucket: ${BUCKET}
`);
    return;
  }

  const uploader = new EmbedsUploader();
  await uploader.uploadAll();
}

const isMain = process.argv[1]?.includes('upload-embeds');
if (isMain) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

export { EmbedsUploader, EMBED_WIDGET_TARGETS };
