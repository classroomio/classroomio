/**
 * HLS playback streaming.
 *
 * Same URL shape as the production Cloudflare Worker that fronts the
 * tenant-router (`/hls/{assetId}/{path}`). In production the Worker
 * intercepts these requests at the edge and serves directly from an R2
 * binding, so Render is never in the bytestream. This Hono route only
 * fires in environments where the Worker isn't in front of the api —
 * primarily local development, but it also acts as a defensive fallback
 * if the Worker route ever misfires.
 *
 * Auth: standard session via `authMiddleware`. We then verify the
 * caller's session belongs to the same organization that owns the
 * asset. No separate `cio_hls` HMAC cookie is needed here — that's only
 * how the Worker authorizes requests in production.
 */

import { GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getAssetById } from '@cio/db/queries/assets';
import { getS3Client, getStorageConfig } from '@cio/core/config/storage';
import { HLS_COOKIE_NAME, verifyHlsToken } from '@cio/core/services/assets/assets';
import { resolveTrustedBrowserOriginForCors } from '@api/utils/origins';
import { getCookie } from 'hono/cookie';

import { Hono } from '@api/utils/hono';

const HLS_CONTENT_TYPES: Record<string, string> = {
  m3u8: 'application/vnd.apple.mpegurl',
  ts: 'video/mp2t',
  m4s: 'video/iso.segment',
  mp4: 'video/mp4',
  m4a: 'audio/mp4',
  aac: 'audio/aac'
};

function contentTypeFor(path: string): string {
  const dot = path.lastIndexOf('.');
  if (dot === -1) return 'application/octet-stream';

  const ext = path.slice(dot + 1).toLowerCase();
  return HLS_CONTENT_TYPES[ext] ?? 'application/octet-stream';
}

/**
 * Only `master.m3u8` is mutable — it gets patched when a p1080 rendition is
 * added later, so it stays short-lived. Variant/media playlists and segments
 * are write-once per assetId/path and never change, so cache them immutably.
 */
function cacheControlFor(relativePath: string): string {
  return relativePath === 'master.m3u8' ? 'private, max-age=10' : 'private, max-age=31536000, immutable';
}

export const hlsRouter = new Hono()
  .options('/:assetId/*', (c) => {
    const origin = c.req.header('origin');
    let corsHeaders: Record<string, string> = {};
    if (origin) {
      const allowed = resolveTrustedBrowserOriginForCors(origin);
      if (allowed) {
        corsHeaders = {
          'Access-Control-Allow-Origin': allowed,
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '600',
          'Cross-Origin-Resource-Policy': 'cross-origin'
        };
      }
    }
    return new Response(null, { status: 204, headers: corsHeaders });
  })
  /**
   * GET/HEAD /hls/:assetId/* — stream an HLS manifest or segment from R2.
   *
   * No `authMiddleware` here — public lessons play through the same route
   * using only the HMAC cookie. The handler validates either the cookie
   * or org-member session itself.
   */
  .on(['GET', 'HEAD'], '/:assetId/*', async (c) => {
    const origin = c.req.header('origin');
    let corsHeaders: Record<string, string> = {};
    if (origin) {
      const allowed = resolveTrustedBrowserOriginForCors(origin);
      if (allowed) {
        corsHeaders = {
          'Access-Control-Allow-Origin': allowed,
          'Access-Control-Allow-Credentials': 'true',
          // Override the `Cross-Origin-Resource-Policy: same-origin` that
          // app-wide `secureHeaders()` sets — the dashboard origin needs to
          // load `<video>` segments from this api origin in local dev /
          // self-hosted, and CORP=same-origin blocks the response even
          // when CORS allows the request.
          'Cross-Origin-Resource-Policy': 'cross-origin'
        };
      }
    }
    const withCors = (body: BodyInit | null, status: number, extraHeaders?: Record<string, string>) =>
      new Response(body, { status, headers: { ...corsHeaders, ...extraHeaders } });

    const assetId = c.req.param('assetId');
    if (!assetId) return withCors(null, 400, { 'Content-Type': 'application/json' });

    const fullPath = c.req.path;
    const marker = `/hls/${assetId}/`;
    const idx = fullPath.indexOf(marker);
    const relative = idx === -1 ? '' : fullPath.slice(idx + marker.length);
    if (!relative || relative.includes('..')) {
      return withCors(null, 400, { 'Content-Type': 'application/json' });
    }

    let authorized = false;
    let denyReason: 'no_token_or_session' | 'token_invalid' | 'session_no_role' | 'asset_missing' =
      'no_token_or_session';
    const token = getCookie(c, HLS_COOKIE_NAME);
    if (token) {
      const verified = await verifyHlsToken(token);
      if (verified?.assetId === assetId) {
        authorized = true;
      } else {
        denyReason = 'token_invalid';
      }
    }
    if (!authorized) {
      const orgRoles = (c.get('orgRoles') as Record<string, number> | undefined) ?? {};
      if (Object.keys(orgRoles).length) {
        const asset = await getAssetById(assetId);
        if (!asset) {
          denyReason = 'asset_missing';
        } else if (orgRoles[asset.organizationId] !== undefined) {
          // role 0 still counts as membership — match `orgMemberMiddleware`'s
          // `roleId === undefined` rejection rule instead of a truthy check.
          authorized = true;
        } else {
          denyReason = 'session_no_role';
        }
      }
    }
    if (!authorized) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `[hls] 403 for asset=${assetId} reason=${denyReason} cookiePresent=${Boolean(token)} hasSession=${Boolean(c.get('user'))}`
        );
      }
      return withCors(null, 403, { 'Content-Type': 'application/json' });
    }

    const config = getStorageConfig();
    const client = getS3Client();
    const objectKey = `${assetId}/${relative}`;

    try {
      if (c.req.method === 'HEAD') {
        const head = await client.send(new HeadObjectCommand({ Bucket: config.bucketVideos, Key: objectKey }));
        const headHeaders: Record<string, string> = {
          'Content-Type': contentTypeFor(relative),
          'Cache-Control': cacheControlFor(relative)
        };
        if (head.ContentLength != null) headHeaders['Content-Length'] = String(head.ContentLength);
        return withCors(null, 200, headHeaders);
      }

      const result = await client.send(new GetObjectCommand({ Bucket: config.bucketVideos, Key: objectKey }));
      if (!result.Body) {
        return withCors(null, 502);
      }

      const headers: Record<string, string> = {
        'Content-Type': contentTypeFor(relative),
        'Cache-Control': cacheControlFor(relative)
      };
      if (result.ContentLength != null) headers['Content-Length'] = String(result.ContentLength);

      return withCors(result.Body as unknown as ReadableStream, 200, headers);
    } catch (error) {
      if (error instanceof Error && error.name === 'NoSuchKey') {
        return withCors(null, 404);
      }
      console.error('hls stream error:', error);
      return withCors(null, 500);
    }
  });
