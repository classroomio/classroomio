import { GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { contentTypeForFile, isoWeekIndex, verifyToken } from '@cio/activity-packages';
import {
  ACTIVITY_CONTENT_CACHE_CONTROL,
  contentHostHeaders,
  getActivitySigningSecret
} from '@cio/core/config/activity-content';
import { getS3Client, getStorageConfig } from '@cio/core/config/storage';
import { isContentHostRequest } from '@api/middlewares/activity-content-host';

import { Hono } from '@api/utils/hono';

/**
 * Normalizes a content-relative path. Returns null when unsafe or empty.
 */
export function normalizeContentPath(raw: string): string | null {
  let decoded: string;

  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null;
  }

  const forward = decoded.replace(/\\/g, '/').normalize('NFC');

  if (forward.includes('\0')) return null;
  if (forward.startsWith('/')) return null;
  if (/^[a-zA-Z]:(\/|$)/.test(forward)) return null;

  const segments = forward.split('/').filter((segment) => segment !== '' && segment !== '.');

  if (segments.length === 0) return null;
  if (segments.some((segment) => segment === '..')) return null;

  return segments.join('/');
}

function isValidRangeHeader(value: string): boolean {
  return /^bytes=\d*-\d*$/.test(value.trim());
}

async function resolveCaseInsensitiveKey(bucket: string, prefix: string, relative: string): Promise<string | null> {
  const client = getS3Client();
  const candidates = [`${prefix}/index.json`, `${prefix}.index.json`];

  for (const indexKey of candidates) {
    try {
      const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: indexKey }));

      if (!result.Body) continue;

      const text = await result.Body.transformToString();
      const parsed: unknown = JSON.parse(text);
      const names: string[] = Array.isArray(parsed)
        ? parsed.filter((entry): entry is string => typeof entry === 'string')
        : Array.isArray((parsed as { files?: unknown }).files)
          ? (parsed as { files: unknown[] }).files.filter((entry): entry is string => typeof entry === 'string')
          : [];

      if (names.includes(relative)) return relative;

      const lowered = relative.toLowerCase();
      const match = names.find((name) => name.toLowerCase() === lowered);

      if (match) return match;
    } catch {
      continue;
    }
  }

  return null;
}

export const activityContentRouter = new Hono().on(['GET', 'HEAD'], '/:contentToken/*', async (c) => {
  if (!isContentHostRequest(c)) return c.body(null, 404);

  const secret = getActivitySigningSecret();

  if (!secret) return c.body(null, 503);

  const contentToken = c.req.param('contentToken');

  if (!contentToken) return c.body(null, 401);

  const fullPath = c.req.path;
  const marker = `/activity/content/${contentToken}/`;
  const markerIndex = fullPath.indexOf(marker);
  const rawRelative = markerIndex === -1 ? '' : fullPath.slice(markerIndex + marker.length);
  const relative = normalizeContentPath(rawRelative);

  if (!relative) return c.body(null, 404);

  let prefix: string;
  let ancestors: string[];

  try {
    const claims = await verifyToken(contentToken, secret);
    const record = claims as unknown as Record<string, unknown>;

    if (typeof record['p'] !== 'string' || typeof record['org'] !== 'string') return c.body(null, 401);

    const week = record['wk'];

    if (!Number.isInteger(week)) return c.body(null, 401);

    const age = isoWeekIndex(new Date(Date.now())) - (week as number);

    if (age < 0 || age > 1) return c.body(null, 401);

    prefix = record['p'] as string;
    ancestors = Array.isArray(record['anc'])
      ? (record['anc'] as unknown[]).filter((entry): entry is string => typeof entry === 'string')
      : [];
  } catch {
    return c.body(null, 401);
  }

  if (!prefix) return c.body(null, 401);

  const config = getStorageConfig();
  const bucket = config.bucketScorm;
  const client = getS3Client();
  const baseHeaders = contentHostHeaders(ancestors);
  const rangeHeader = c.req.header('range') ?? null;

  if (rangeHeader && !isValidRangeHeader(rangeHeader)) {
    return new Response(null, { status: 416, headers: { ...baseHeaders, 'Accept-Ranges': 'bytes' } });
  }

  const sendHeaders = (extra: Record<string, string>) => ({ ...baseHeaders, ...extra });

  try {
    if (c.req.method === 'HEAD') {
      try {
        const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: `${prefix}/${relative}` }));
        const headers = sendHeaders({
          'Content-Type': head.ContentType ?? contentTypeForFile(relative),
          'Cache-Control': ACTIVITY_CONTENT_CACHE_CONTROL,
          'Accept-Ranges': 'bytes'
        });

        if (head.ContentLength != null) headers['Content-Length'] = String(head.ContentLength);
        if (head.ETag) headers['ETag'] = head.ETag;

        return new Response(null, { status: 200, headers });
      } catch (error) {
        if (error instanceof Error && (error.name === 'NoSuchKey' || error.name === 'NotFound')) {
          return c.body(null, 404);
        }

        throw error;
      }
    }

    try {
      const result = await client.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: `${prefix}/${relative}`,
          ...(rangeHeader ? { Range: rangeHeader.trim() } : {})
        })
      );

      if (!result.Body) return c.body(null, 502);

      const contentType =
        typeof result.ContentType === 'string' && result.ContentType
          ? result.ContentType
          : contentTypeForFile(relative);
      const headers = sendHeaders({
        'Content-Type': contentType,
        'Cache-Control': ACTIVITY_CONTENT_CACHE_CONTROL,
        'Accept-Ranges': 'bytes'
      });

      if (result.ContentLength != null) headers['Content-Length'] = String(result.ContentLength);
      if (result.ETag) headers['ETag'] = result.ETag;

      if (rangeHeader) {
        if (result.ContentRange) headers['Content-Range'] = result.ContentRange;

        return new Response(result.Body as unknown as ReadableStream, { status: 206, headers });
      }

      return new Response(result.Body as unknown as ReadableStream, { status: 200, headers });
    } catch (error) {
      const isMissing =
        error instanceof Error &&
        (error.name === 'NoSuchKey' || error.name === 'NotFound' || error.name === 'NoSuchBucket');

      if (!isMissing) throw error;

      if (error instanceof Error && error.name === 'NoSuchBucket') return c.body(null, 404);

      const fallback = await resolveCaseInsensitiveKey(bucket, prefix, relative);

      if (!fallback) return c.body(null, 404);

      try {
        const result = await client.send(
          new GetObjectCommand({
            Bucket: bucket,
            Key: `${prefix}/${fallback}`,
            ...(rangeHeader ? { Range: rangeHeader.trim() } : {})
          })
        );

        if (!result.Body) return c.body(null, 502);

        const contentType =
          typeof result.ContentType === 'string' && result.ContentType
            ? result.ContentType
            : contentTypeForFile(fallback);
        const headers = sendHeaders({
          'Content-Type': contentType,
          'Cache-Control': ACTIVITY_CONTENT_CACHE_CONTROL,
          'Accept-Ranges': 'bytes'
        });

        if (result.ContentLength != null) headers['Content-Length'] = String(result.ContentLength);
        if (result.ETag) headers['ETag'] = result.ETag;

        if (rangeHeader) {
          if (result.ContentRange) headers['Content-Range'] = result.ContentRange;

          return new Response(result.Body as unknown as ReadableStream, { status: 206, headers });
        }

        return new Response(result.Body as unknown as ReadableStream, { status: 200, headers });
      } catch (fallbackError) {
        if (
          fallbackError instanceof Error &&
          (fallbackError.name === 'NoSuchKey' || fallbackError.name === 'NotFound')
        ) {
          return c.body(null, 404);
        }

        throw fallbackError;
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'InvalidRange') {
      return new Response(null, { status: 416, headers: { ...baseHeaders, 'Accept-Ranges': 'bytes' } });
    }

    console.error('activity content error:', error);
    return c.body(null, 500);
  }
});
