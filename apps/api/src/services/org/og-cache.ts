import { GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

import { getStorageConfig, getS3Client } from '@cio/core/config/storage';
import { uploadToS3 } from '@cio/core/utils/s3';
import { getOrgSiteOgObjectKey } from '@cio/utils/org-site/og-public-url';

const OG_ETAG_METADATA_KEY = 'og-etag';

export function getOrgSiteOgPublicUrl(siteName: string): string | null {
  const mediaPublicBaseUrl = getStorageConfig().mediaPublicBaseUrl;
  if (!mediaPublicBaseUrl) {
    return null;
  }

  return `${mediaPublicBaseUrl.replace(/\/$/, '')}/${getOrgSiteOgObjectKey(siteName)}`;
}

async function readCachedOrgSiteOgBuffer(siteName: string, etag: string): Promise<Buffer | null> {
  const config = getStorageConfig();
  const key = getOrgSiteOgObjectKey(siteName);

  try {
    const head = await getS3Client().send(
      new HeadObjectCommand({
        Bucket: config.bucketMedia,
        Key: key
      })
    );

    if (head.Metadata?.[OG_ETAG_METADATA_KEY] !== etag) {
      return null;
    }

    const object = await getS3Client().send(
      new GetObjectCommand({
        Bucket: config.bucketMedia,
        Key: key
      })
    );

    const body = object.Body;
    if (!body) {
      return null;
    }

    const bytes = await body.transformToByteArray();
    return Buffer.from(bytes);
  } catch {
    return null;
  }
}

export async function persistOrgSiteOgImage(siteName: string, buffer: Buffer, etag: string): Promise<string | null> {
  const config = getStorageConfig();
  const publicUrl = getOrgSiteOgPublicUrl(siteName);
  if (!publicUrl) {
    return null;
  }

  const uploadResult = await uploadToS3({
    Bucket: config.bucketMedia,
    Key: getOrgSiteOgObjectKey(siteName),
    Body: buffer,
    ContentType: 'image/png',
    CacheControl: 'public, max-age=3600, stale-while-revalidate=86400',
    Metadata: {
      [OG_ETAG_METADATA_KEY]: etag
    }
  });

  if (!uploadResult.success) {
    console.error('persistOrgSiteOgImage error:', uploadResult.error);
    return null;
  }

  return publicUrl;
}

export async function getCachedOrgSiteOgBuffer(siteName: string, etag: string): Promise<Buffer | null> {
  try {
    return await readCachedOrgSiteOgBuffer(siteName, etag);
  } catch (error) {
    console.error('getCachedOrgSiteOgBuffer error:', error);
    return null;
  }
}
