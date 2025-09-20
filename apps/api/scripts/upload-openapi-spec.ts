#!/usr/bin/env tsx

import 'dotenv/config';

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { mkdirSync, writeFileSync } from 'fs';

import { app } from '../src/app';
import { env } from '../src/config/env';
import { generateSpecs } from 'hono-openapi';
import { join } from 'path';

interface UploadOptions {
  key: string;
  content: string;
  contentType?: string;
}

class OpenAPISpecGenerator {
  private s3Client: S3Client | null = null;

  constructor() {
    this.initializeS3Client();
  }

  private initializeS3Client() {
    if (
      env.CLOUDFLARE_ACCESS_KEY &&
      env.CLOUDFLARE_SECRET_ACCESS_KEY &&
      env.CLOUDFLARE_ACCOUNT_ID
    ) {
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

      const specString = JSON.stringify(spec, null, 2);
      console.log('✅ OpenAPI specification generated successfully');

      return specString;
    } catch (error) {
      console.error('❌ Error generating OpenAPI spec:', error);
      throw error;
    }
  }

  async saveLocalSpec(spec: string): Promise<string> {
    try {
      const outputDir = join(process.cwd(), 'dist', 'openapi');
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

      // await this.saveLocalSpec(spec);

      if (this.s3Client) {
        const uploadKey = `openapi/openapi-${new Date().toISOString().split('T')[0]}.json`;
        await this.uploadToR2({
          key: uploadKey,
          content: spec,
          contentType: 'application/json'
        });

        // Also upload as latest version
        await this.uploadToR2({
          key: 'openapi/openapi-latest.json',
          content: spec,
          contentType: 'application/json'
        });
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
