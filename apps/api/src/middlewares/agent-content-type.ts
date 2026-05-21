import type { Context, Next } from 'hono';
import { AGENT_CONTENT_TYPE } from '@cio/utils/constants';

/**
 * The dashboard wraps `/agent/*` write bodies in a base64 envelope —
 * `{"b64":"<base64 of inner JSON>"}` — and tags them with
 * `application/x-cio-agent`. Render fronts our service with its own Cloudflare,
 * whose OWASP managed rules body-inspect every JSON request and 403 anything
 * that looks like SQL injection / XSS / command injection / markdown
 * jailbreak — patterns that AI-generated lesson content, fetched docs, and
 * the conversation history naturally produce. CF cannot pattern-match
 * base64, so the envelope passes inspection. This middleware unwraps the
 * envelope and restores a plain `application/json` body before zValidator
 * (which gates on a `/application\/.+?\+?json/` regex) parses it, so route
 * handlers downstream see the request unchanged.
 */
export const agentContentTypeRewrite = async (c: Context, next: Next) => {
  const ct = c.req.header('content-type')?.toLowerCase() ?? '';
  if (!ct.startsWith(AGENT_CONTENT_TYPE)) {
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
    return c.json({ success: false, error: 'INVALID_AGENT_ENVELOPE', code: 'INVALID_AGENT_ENVELOPE' }, 400);
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
