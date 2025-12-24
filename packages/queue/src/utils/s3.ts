import { S3Client, GetObjectCommand, PutObjectCommand, PutObjectCommandInput } from '@aws-sdk/client-s3';
import { queueEnv } from '../config/env';

let s3ClientInstance: S3Client | null = null;

export function getS3Client(): S3Client {
  if (s3ClientInstance) {
    return s3ClientInstance;
  }

  if (!queueEnv.CLOUDFLARE_ACCOUNT_ID || !queueEnv.CLOUDFLARE_ACCESS_KEY || !queueEnv.CLOUDFLARE_SECRET_ACCESS_KEY) {
    throw new Error(
      'S3/R2 credentials not configured. Set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_ACCESS_KEY, and CLOUDFLARE_SECRET_ACCESS_KEY'
    );
  }

  s3ClientInstance = new S3Client({
    region: 'auto',
    endpoint: `https://${queueEnv.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: queueEnv.CLOUDFLARE_ACCESS_KEY,
      secretAccessKey: queueEnv.CLOUDFLARE_SECRET_ACCESS_KEY
    }
  });

  return s3ClientInstance;
}

export async function downloadFromS3(
  bucket: string,
  key: string,
  maxRetries = 15,
  initialDelay = 3000
): Promise<Buffer> {
  const client = getS3Client();

  // Retry logic with exponential backoff
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const command = new GetObjectCommand({ Bucket: bucket, Key: key });
      const response = await client.send(command);

      if (!response.Body) {
        throw new Error(`Failed to download ${key} from S3`);
      }

      const chunks: Uint8Array[] = [];
      const reader = (response.Body as any).transformToWebStream().getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      const buffer = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
      return buffer;
    } catch (error: any) {
      // Check if it's a NoSuchKey error (file doesn't exist yet)
      // AWS SDK v3 uses different error structures, check multiple properties
      const isNoSuchKey =
        error.name === 'NoSuchKey' ||
        error.Code === 'NoSuchKey' ||
        error.$metadata?.httpStatusCode === 404 ||
        (error.message && error.message.includes('does not exist'));

      if (isNoSuchKey) {
        if (attempt < maxRetries - 1) {
          const delay = initialDelay * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      }
      // If it's not a NoSuchKey error or we've exhausted retries, throw
      throw error;
    }
  }

  throw new Error(`Failed to download ${key} from S3 after ${maxRetries} attempts`);
}

export async function uploadToS3(params: PutObjectCommandInput): Promise<void> {
  const client = getS3Client();
  const command = new PutObjectCommand(params);

  await client.send(command);
}
