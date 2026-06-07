/**
 * Transcript VTT proxy.
 *
 * `<track>` elements inside `<video crossorigin="anonymous">` can only
 * load resources that return CORS headers. We serve the VTT through the
 * api the same way we do HLS segments, rendering it on the fly from the
 * stored transcript segments (the structured source of truth) so edits
 * are reflected immediately without an R2 round trip. The path is
 * same-origin behind the tenant-router Worker in prod and a CORS-allowed
 * cross-origin call in local dev.
 *
 * Auth mirrors `/hls/*`:
 *   1. Valid `cio_hls` HMAC cookie whose `aid` matches the assetId, OR
 *   2. Authenticated session with org-member access to the asset's org.
 */

import { getAssetById } from '@cio/db/queries/assets';
import { getMediaTranscriptByAsset } from '@cio/db/queries';
import { segmentsToWebVtt } from '@cio/utils/functions';
import { HLS_COOKIE_NAME, verifyHlsToken } from '@cio/core/services/assets/assets';
import { resolveTrustedBrowserOriginForCors } from '@api/utils/origins';
import { getCookie } from 'hono/cookie';

import { Hono } from '@api/utils/hono';

export const transcriptsRouter = new Hono()
  .options('/:assetId/track.vtt', (c) => {
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
   * GET/HEAD /transcripts/:assetId/track.vtt — render a transcript VTT
   * from the stored segments with cross-origin CORS so a `<track crossorigin>`
   * element in the dashboard can load it.
   */
  .on(['GET', 'HEAD'], '/:assetId/track.vtt', async (c) => {
    const assetId = c.req.param('assetId');
    if (!assetId) return c.json({ success: false, message: 'Missing assetId' }, 400);

    const origin = c.req.header('origin');
    let corsHeaders: Record<string, string> = {};
    if (origin) {
      const allowed = resolveTrustedBrowserOriginForCors(origin);
      if (allowed) {
        corsHeaders = {
          'Access-Control-Allow-Origin': allowed,
          'Access-Control-Allow-Credentials': 'true',
          'Cross-Origin-Resource-Policy': 'cross-origin'
        };
      }
    }
    const withCors = (body: BodyInit | null, status: number, extraHeaders?: Record<string, string>) =>
      new Response(body, { status, headers: { ...corsHeaders, ...extraHeaders } });

    const asset = await getAssetById(assetId);
    if (!asset) return withCors(null, 404);

    let authorized = false;
    const token = getCookie(c, HLS_COOKIE_NAME);
    if (token) {
      const verified = await verifyHlsToken(token);
      if (verified?.assetId === assetId) authorized = true;
    }
    if (!authorized) {
      const orgRoles = (c.get('orgRoles') as Record<string, number> | undefined) ?? {};
      if (orgRoles[asset.organizationId]) authorized = true;
    }
    if (!authorized) {
      return withCors(null, 403);
    }

    const transcript = await getMediaTranscriptByAsset(assetId, asset.organizationId);
    if (!transcript) return withCors(null, 404);

    const vttHeaders = {
      'Content-Type': 'text/vtt; charset=utf-8',
      'Cache-Control': 'private, no-cache'
    };

    if (c.req.method === 'HEAD') {
      return withCors(null, 200, vttHeaders);
    }

    const vtt = segmentsToWebVtt(transcript.segments);

    return withCors(vtt, 200, vttHeaders);
  });
