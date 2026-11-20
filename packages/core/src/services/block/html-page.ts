import { randomUUID } from 'node:crypto';

import { createAsset, getAssetById } from '@cio/db/queries/assets';
import type { TAsset } from '@cio/db/types';
import { AppError, ErrorCodes } from '@cio/utils/errors';
import { HTML_BLOCK_NAME_MAX_LENGTH, HTML_PAGE_MAX_BYTES, type THtmlPage } from '@cio/utils/validation/block';

import { getStorageConfig } from '../../config/storage';
import { getFromS3, uploadToS3 } from '../../utils/s3';

const HTML_PAGE_SOURCE = 'html_block';
const HTML_PAGE_MIME_TYPE = 'text/html';

function isHtmlPageAsset(asset: TAsset): boolean {
  const metadata = (asset.metadata ?? {}) as Record<string, unknown>;

  return asset.mimeType === HTML_PAGE_MIME_TYPE && metadata.source === HTML_PAGE_SOURCE && asset.status === 'active';
}

/**
 * A file name for a page: its <title> as a slug, or `fallback` when it has none.
 */
export function deriveHtmlPageName(html: string, fallback: string): string {
  const title = /<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1] ?? '';
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const name = slug ? `${slug}.html` : fallback;

  return name.slice(0, HTML_BLOCK_NAME_MAX_LENGTH);
}

export interface HtmlPageInput {
  organizationId: string;
  profileId: string;
  name: string;
  html: string;
}

/**
 * Stores an HTML page in the documents bucket and records it as an organization asset.
 * Throws HTML_TOO_LARGE past {@link HTML_PAGE_MAX_BYTES}.
 */
export async function createHtmlPage({ organizationId, profileId, name, html }: HtmlPageInput): Promise<THtmlPage> {
  const body = Buffer.from(html, 'utf8');
  if (body.byteLength > HTML_PAGE_MAX_BYTES) {
    throw new AppError('The HTML page is too large', ErrorCodes.HTML_TOO_LARGE, 413);
  }

  const config = getStorageConfig();
  const storageKey = `${organizationId}/html-pages/${randomUUID()}.html`;
  // Stored as plain text so a raw storage URL never renders the page; only the sandboxed content route serves it as HTML.
  const upload = await uploadToS3({
    Bucket: config.bucketDocuments,
    Key: storageKey,
    Body: body,
    ContentType: 'text/plain; charset=utf-8'
  });
  if (!upload.success) {
    throw new AppError('Failed to store the HTML page', ErrorCodes.INTERNAL_ERROR, 502);
  }

  const asset = await createAsset({
    organizationId,
    kind: 'document',
    provider: 'upload',
    storageProvider: 's3',
    storageKey,
    mimeType: HTML_PAGE_MIME_TYPE,
    byteSize: body.byteLength,
    title: name,
    status: 'active',
    metadata: { source: HTML_PAGE_SOURCE },
    createdByProfileId: profileId
  });

  return { name, assetId: asset.id, size: body.byteLength };
}

/**
 * Reads an HTML page asset's markup. Pass `organizationId` to require the asset to belong to it.
 * @returns null when the asset is missing, is not an HTML page, or its file is gone.
 */
export async function readHtmlPage(assetId: string, organizationId?: string): Promise<string | null> {
  const asset = await getAssetById(assetId, organizationId);
  if (!asset?.storageKey || !isHtmlPageAsset(asset)) return null;

  const config = getStorageConfig();
  const result = await getFromS3({ Bucket: config.bucketDocuments, Key: asset.storageKey });
  if (!result.success || !result.data?.Body) return null;

  return (await result.data.Body.transformToString('utf-8')) as string;
}
