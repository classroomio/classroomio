import * as z from 'zod';

import { readHtmlPage } from '@cio/core/services/block/html-page';
import { isHtmlContentHost, verifyHtmlContentSignature } from '@cio/core/utils/html-content';
import { zValidator } from '@hono/zod-validator';

import { Hono } from '@api/utils/hono';

const ZHtmlContentParam = z.object({ assetId: z.uuid() });
const ZHtmlContentQuery = z.object({
  exp: z.coerce.number().int().positive(),
  sig: z.string().min(1).max(128),
  download: z.literal('1').optional()
});

const CONTENT_SECURITY_POLICY = [
  'sandbox allow-scripts allow-modals allow-popups',
  "default-src 'none'",
  "script-src 'unsafe-inline' 'unsafe-eval' https:",
  "style-src 'unsafe-inline' https:",
  'img-src data: blob: https:',
  'font-src data: https:',
  'media-src data: blob: https:',
  "connect-src 'none'",
  "form-action 'none'",
  "base-uri 'none'",
  'frame-ancestors https: http://localhost:* http://*.localhost:*'
].join('; ');

const HTML_CONTENT_HEADERS = {
  'Content-Type': 'text/html; charset=utf-8',
  'Content-Security-Policy': CONTENT_SECURITY_POLICY,
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Cross-Origin-Resource-Policy': 'cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), clipboard-read=()',
  'Cache-Control': 'private, max-age=3600'
};

function notFound() {
  return new Response('Not found', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

/**
 * Serves stored HTML pages behind a signed URL, with a CSP that sandboxes the page and blocks network access,
 * form posts and framing outside https pages.
 */
export const htmlContentRouter = new Hono().get(
  '/:assetId',
  zValidator('param', ZHtmlContentParam),
  zValidator('query', ZHtmlContentQuery),
  async (c) => {
    if (!isHtmlContentHost(c.req.header('host'))) return notFound();

    const { assetId } = c.req.valid('param');
    const { exp, sig, download } = c.req.valid('query');
    if (!verifyHtmlContentSignature(assetId, exp, sig)) {
      return new Response('Link expired', { status: 403, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }

    const html = await readHtmlPage(assetId);
    if (html === null) return notFound();

    const headers: Record<string, string> = { ...HTML_CONTENT_HEADERS };
    if (download) headers['Content-Disposition'] = 'attachment; filename="page.html"';

    return new Response(html, { status: 200, headers });
  }
);
