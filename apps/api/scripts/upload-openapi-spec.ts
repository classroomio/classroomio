#!/usr/bin/env tsx

import 'dotenv/config';

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { mkdirSync, writeFileSync } from 'fs';

import { app } from '../src/app';
import { env } from '@cio/core/config/env';
import { generateSpecs } from 'hono-openapi';
import { join } from 'path';
import { enrichPublicApiOpenApiSpec, PUBLIC_API_OPENAPI_URL } from '@cio/utils/openapi/public-api';

const OPENAPI_CDN_BASE_URL = PUBLIC_API_OPENAPI_URL.replace(/\/openapi-latest\.json$/, '');

/** Cloudflare allows a limited number of URLs per purge request. */
const PURGE_URL_BATCH = 30;

/**
 * Purge Cloudflare edge cache for public OpenAPI spec URLs.
 * R2 is origin storage; purging fixes stale responses when the hostname is proxied through Cloudflare.
 */
async function purgeCloudflareCdnForUrls(urls: string[]): Promise<void> {
  if (process.env.OPENAPI_SKIP_CDN_PURGE === '1' || process.env.OPENAPI_SKIP_CDN_PURGE === 'true') {
    console.log('Skipping Cloudflare CDN purge (OPENAPI_SKIP_CDN_PURGE is set).');
    return;
  }

  const token = process.env.CLOUDFLARE_API_TOKEN;
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;

  if (!token || !zoneId) {
    console.log(
      'Skipping Cloudflare CDN cache purge. Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID to purge before and after upload.'
    );
    return;
  }

  if (urls.length === 0) {
    return;
  }

  const uniqueUrls = [...new Set(urls)];

  for (let index = 0; index < uniqueUrls.length; index += PURGE_URL_BATCH) {
    const batch = uniqueUrls.slice(index, index + PURGE_URL_BATCH);
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

function getOpenApiCdnUrls(uploadKey: string): string[] {
  const datedFileName = uploadKey.split('/').pop()!;

  return [PUBLIC_API_OPENAPI_URL, `${OPENAPI_CDN_BASE_URL}/${datedFileName}`];
}

interface UploadOptions {
  key: string;
  content: string;
  contentType?: string;
}

function filterPublicApiSpec(spec: Record<string, unknown>) {
  const paths = (spec.paths ?? {}) as Record<string, unknown>;
  const publicApiPaths = Object.fromEntries(
    Object.entries(paths).filter(([path]) => path.startsWith('/public-api/v1/'))
  );

  const tags = Array.isArray(spec.tags)
    ? spec.tags.filter((tag) => {
        if (!tag || typeof tag !== 'object' || !('name' in tag)) {
          return false;
        }

        return typeof tag.name === 'string' && tag.name.startsWith('Public API');
      })
    : undefined;

  return enrichPublicApiOpenApiSpec({
    ...spec,
    openapi: spec.openapi ?? '3.1.0',
    paths: publicApiPaths,
    tags
  });
}

class OpenAPISpecGenerator {
  private s3Client: S3Client | null = null;

  constructor() {
    this.initializeS3Client();
  }

  private initializeS3Client() {
    if (env.CLOUDFLARE_ACCESS_KEY && env.CLOUDFLARE_SECRET_ACCESS_KEY && env.CLOUDFLARE_ACCOUNT_ID) {
      this.s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: env.CLOUDFLARE_ACCESS_KEY,
          secretAccessKey: env.CLOUDFLARE_SECRET_ACCESS_KEY
        }
      });
      console.log('✅ S3 client initialized for Cloudflare R2');
    } else {
      console.warn('⚠️  Cloudflare R2 credentials not found. Will only generate local spec file.');
    }
  }

  async generateSpec(): Promise<string> {
    try {
      console.log('🔄 Generating OpenAPI specification...');

      // Generate the OpenAPI spec from the Hono app
      const spec = await generateSpecs(app, {
        documentation: {
          info: {
            title: 'ClassroomIO API',
            version: '1.0.0',
            description: 'Manage your organization on classroomio via the API',
            contact: {
              name: 'ClassroomIO',
              url: 'https://classroomio.com'
            }
          },
          servers: [
            {
              url: 'https://api.classroomio.com',
              description: 'Production environment'
            },
            {
              url: 'http://localhost:3002',
              description: 'Development environment'
            }
          ]
        }
      });

      const publicApiSpec = filterPublicApiSpec(spec as Record<string, unknown>);
      const specString = JSON.stringify(publicApiSpec, null, 2);
      console.log('✅ OpenAPI specification generated successfully');

      return specString;
    } catch (error) {
      console.error('❌ Error generating OpenAPI spec:', error);
      throw error;
    }
  }

  async saveLocalSpec(spec: string): Promise<string> {
    try {
      const outputDir = join(process.cwd(), 'dist', 'openapi', 'public-api');
      mkdirSync(outputDir, { recursive: true });

      const filePath = join(outputDir, 'openapi.json');
      writeFileSync(filePath, spec, 'utf8');

      console.log(`✅ OpenAPI spec saved locally: ${filePath}`);
      return filePath;
    } catch (error) {
      console.error('❌ Error saving local spec:', error);
      throw error;
    }
  }

  async uploadToR2(options: UploadOptions): Promise<void> {
    if (!this.s3Client) {
      throw new Error('S3 client not initialized. Check your Cloudflare R2 credentials.');
    }

    try {
      console.log(`🔄 Uploading to R2 bucket`);

      const command = new PutObjectCommand({
        Bucket: 'api',
        Key: options.key,
        Body: options.content,
        ContentType: options.contentType || 'application/json',
        CacheControl: 'public, max-age=3600' // Cache for 1 hour
      });

      await this.s3Client.send(command);
      console.log(`✅ Successfully uploaded to R2`);
    } catch (error) {
      console.error('❌ Error uploading to R2:', error);
      throw error;
    }
  }

  async generateAndUpload(): Promise<void> {
    try {
      const spec = await this.generateSpec();

      await this.saveLocalSpec(spec);

      if (this.s3Client) {
        const uploadKey = `openapi/public-api/openapi-${new Date().toISOString().split('T')[0]}.json`;
        const cdnUrls = getOpenApiCdnUrls(uploadKey);

        await purgeCloudflareCdnForUrls(cdnUrls);

        await this.uploadToR2({
          key: uploadKey,
          content: spec,
          contentType: 'application/json'
        });

        await this.uploadToR2({
          key: 'openapi/public-api/openapi-latest.json',
          content: spec,
          contentType: 'application/json'
        });

        await purgeCloudflareCdnForUrls(cdnUrls);
      }

      console.log('🎉 OpenAPI spec generation and upload completed successfully!');
    } catch (error) {
      console.error('❌ Failed to generate and upload OpenAPI spec:', error);
      process.exit(1);
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: tsx scripts/upload-openapi-spec.ts

Examples:
  tsx scripts/upload-openapi-spec.ts

Environment Variables Required for R2 Upload:
  CLOUDFLARE_ACCESS_KEY
  CLOUDFLARE_SECRET_ACCESS_KEY
  CLOUDFLARE_ACCOUNT_ID

Optional — purge Cloudflare CDN cache for api.cdn.clsrio.com (before and after upload):
  CLOUDFLARE_API_TOKEN   (Zone → Cache Purge → Purge)
  CLOUDFLARE_ZONE_ID
  OPENAPI_SKIP_CDN_PURGE=1 to skip purge
    `);
    return;
  }

  const generator = new OpenAPISpecGenerator();
  await generator.generateAndUpload();
}

// Run the script if called directly
if (process.argv[1] && process.argv[1].endsWith('upload-openapi-spec.ts')) {
  main()
    .then(() => {
      console.log('Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

export { OpenAPISpecGenerator };
