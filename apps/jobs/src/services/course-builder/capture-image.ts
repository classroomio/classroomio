import { createHash } from 'node:crypto';

import type { Fetcher } from '@cio/course-builder';

import { getStorageConfig } from '../../config/storage';
import { mediaBucket, uploadBufferToBucket } from '../../utils/storage';

/** Raster formats only: an SVG can carry script, and a copied image is served from our own domain. */
const IMAGE_TYPES: Record<string, { extension: string; matches: (bytes: Buffer) => boolean }> = {
  'image/png': {
    extension: 'png',
    matches: (bytes) => bytes.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]))
  },
  'image/jpeg': { extension: 'jpg', matches: (bytes) => bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])) },
  'image/gif': { extension: 'gif', matches: (bytes) => bytes.subarray(0, 3).toString('latin1') === 'GIF' },
  'image/webp': {
    extension: 'webp',
    matches: (bytes) =>
      bytes.subarray(0, 4).toString('latin1') === 'RIFF' && bytes.subarray(8, 12).toString('latin1') === 'WEBP'
  },
  'image/avif': { extension: 'avif', matches: (bytes) => bytes.subarray(4, 8).toString('latin1') === 'ftyp' }
};
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ACCEPT = 'image/avif,image/webp,image/png,image/jpeg,image/gif';

export type ImageCapturer = (imageUrl: string, organizationId: string) => Promise<string | null>;

/**
 * Copies a page's image into the media bucket, under the organisation, and returns its public URL. The same image is
 * stored once per organisation. Null for anything that is not a raster image, too large, or unreachable.
 */
export function createImageCapturer(fetcher: Fetcher, publicBaseUrl: string): ImageCapturer {
  const base = publicBaseUrl.replace(/\/$/, '');

  return async (imageUrl, organizationId) => {
    const response = await fetcher.get(imageUrl, { accept: ACCEPT, maxBytes: MAX_IMAGE_BYTES, binary: true });
    const contentType = (response.headers['content-type'] ?? '').split(';')[0].trim().toLowerCase();
    const type = IMAGE_TYPES[contentType];
    const bytes = response.bytes;
    if (response.status !== 200 || response.truncated || !type || !bytes?.length || !type.matches(bytes)) return null;

    const name = createHash('sha256').update(imageUrl).digest('hex').slice(0, 40);
    const key = `course-build/${organizationId}/${name}.${type.extension}`;
    await uploadBufferToBucket(mediaBucket(), key, bytes, contentType, 'public, max-age=31536000, immutable');

    return `${base}/${key}`;
  };
}

/** The capturer when object storage and its public media URL are configured; otherwise images link to the source. */
export function imageCapturerFromEnv(fetcher: Fetcher): ImageCapturer | null {
  try {
    const publicBaseUrl = getStorageConfig().mediaPublicBaseUrl;

    return publicBaseUrl ? createImageCapturer(fetcher, publicBaseUrl) : null;
  } catch {
    return null;
  }
}
