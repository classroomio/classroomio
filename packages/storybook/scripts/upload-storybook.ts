#!/usr/bin/env tsx

import 'dotenv/config';

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { join, relative } from 'path';
import { readFileSync, readdirSync, statSync } from 'fs';

interface UploadOptions {
  key: string;
  content: Buffer | string;
  contentType?: string;
}

class StorybookUploader {
  private s3Client: S3Client | null = null;
  private buildDir: string;
  private bucket: string;

  constructor() {
    this.buildDir = join(process.cwd(), 'storybook-static');
    this.bucket = 'assets';
    this.initializeS3Client();
  }

  private initializeS3Client() {
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
      console.log('✅ S3 client initialized for Cloudflare R2');
    } else {
      console.warn('⚠️  Cloudflare R2 credentials not found. Cannot upload to R2.');
      throw new Error('Missing Cloudflare R2 credentials');
    }
  }

  private getContentType(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const contentTypes: Record<string, string> = {
      html: 'text/html',
      js: 'application/javascript',
      json: 'application/json',
      css: 'text/css',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      svg: 'image/svg+xml',
      ico: 'image/x-icon',
      woff: 'font/woff',
      woff2: 'font/woff2',
      ttf: 'font/ttf',
      eot: 'application/vnd.ms-fontobject',
      map: 'application/json',
      txt: 'text/plain',
      xml: 'application/xml'
    };
    return contentTypes[ext || ''] || 'application/octet-stream';
  }

  private getCacheControl(filePath: string): string {
    // Cache static assets longer, HTML files shorter
    if (filePath.endsWith('.html')) {
      return 'public, max-age=300'; // 5 minutes for HTML
    }
    if (filePath.match(/\.(js|css|woff|woff2|ttf|png|jpg|jpeg|gif|svg|ico)$/)) {
      return 'public, max-age=31536000, immutable'; // 1 year for assets
    }
    return 'public, max-age=3600'; // 1 hour default
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

  async uploadFile(filePath: string): Promise<void> {
    if (!this.s3Client) {
      throw new Error('S3 client not initialized. Check your Cloudflare R2 credentials.');
    }

    try {
      const fullPath = join(this.buildDir, filePath);
      const content = readFileSync(fullPath);
      const contentType = this.getContentType(filePath);
      const cacheControl = this.getCacheControl(filePath);

      // Upload to storybook/ directory in R2
      const key = `storybook/${filePath}`;

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: content,
        ContentType: contentType,
        CacheControl: cacheControl
      });

      await this.s3Client.send(command);
      console.log(`✅ Uploaded: ${filePath}`);
    } catch (error) {
      console.error(`❌ Error uploading ${filePath}:`, error);
      throw error;
    }
  }

  async uploadAll(): Promise<void> {
    try {
      // Check if build directory exists
      try {
        statSync(this.buildDir);
      } catch {
        throw new Error(`Build directory not found: ${this.buildDir}. Please run 'pnpm build' first.`);
      }

      console.log('🔄 Starting Storybook upload to R2...');
      console.log(`📁 Build directory: ${this.buildDir}`);

      const files = this.getAllFiles(this.buildDir);
      console.log(`📦 Found ${files.length} files to upload`);

      // Upload files in batches to avoid overwhelming the API
      const batchSize = 10;
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        await Promise.all(batch.map((file) => this.uploadFile(file)));
        console.log(`📤 Uploaded batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(files.length / batchSize)}`);
      }

      console.log('🎉 Storybook upload completed successfully!');
      console.log(`📊 Total files uploaded: ${files.length}`);
    } catch (error) {
      console.error('❌ Failed to upload Storybook:', error);
      throw error;
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: tsx scripts/upload-storybook.ts

Examples:
  tsx scripts/upload-storybook.ts

Environment Variables Required for R2 Upload:
  CLOUDFLARE_ACCESS_KEY
  CLOUDFLARE_SECRET_ACCESS_KEY
  CLOUDFLARE_ACCOUNT_ID
    `);
    return;
  }

  const uploader = new StorybookUploader();
  await uploader.uploadAll();
}

// Run the script if called directly
if (process.argv[1] && process.argv[1].endsWith('upload-storybook.ts')) {
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

export { StorybookUploader };
