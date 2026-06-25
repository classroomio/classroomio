import type { Context, Next } from 'hono';
import { CIO_ENVELOPE_CONTENT_TYPE } from '@cio/utils/constants';

/**
 * Unwraps the base64 envelope used on write endpoints whose bodies contain
 * HTML or AI-generated content. The dashboard wraps such bodies as
 * `{"b64":"<base64 of inner JSON>"}` with `Content-Type: application/x-cio-agent`
 * so Render's Cloudflare WAF (OWASP managed rules) cannot body-inspect the
 * payload. This middleware decodes the envelope and restores a plain
 * `application/json` body before zValidator runs.
 */
export const b64EnvelopeRewrite = async (c: Context, next: Next) => {
  const ct = c.req.header('content-type')?.toLowerCase() ?? '';
  if (!ct.startsWith(CIO_ENVELOPE_CONTENT_TYPE)) {
    return next();
  }

  const envelope = await c.req.raw.text();
  let innerJson: string;
  try {
    const parsed = JSON.parse(envelope) as { b64?: string };
    // Accept either shape during the deploy window:
    //   - new dashboard:  {"b64":"<base64 of inner JSON>"}  → decode
    //   - old dashboard:  <inner JSON directly>             → pass through
    // The old path still risks a WAF 403 but at least keeps requests flowing
    // until the dashboard rollout catches up.
    innerJson = typeof parsed.b64 === 'string' ? Buffer.from(parsed.b64, 'base64').toString('utf-8') : envelope;
  } catch {
    return c.json({ success: false, error: 'INVALID_B64_ENVELOPE', code: 'INVALID_B64_ENVELOPE' }, 400);
  }

  const headers = new Headers(c.req.raw.headers);
  headers.set('content-type', 'application/json');
  c.req.raw = new Request(c.req.raw.url, {
    method: c.req.raw.method,
    headers,
    body: innerJson
  });

  return next();
};
