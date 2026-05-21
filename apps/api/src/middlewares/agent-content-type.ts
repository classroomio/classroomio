import type { Context, Next } from 'hono';
import { AGENT_CONTENT_TYPE } from '@cio/utils/constants';

/**
 * Render fronts services with Cloudflare's OWASP Managed Rules, which scan
 * `application/json` bodies and 403 anything that looks like SQL injection.
 * AI chat content trips this constantly (`SELECT … WHERE …`, `OR 1=1` etc.).
 * The dashboard sends `/agent/*` writes as `application/x-cio-agent`; this
 * middleware swaps the header back to `application/json` so Hono's zValidator
 * (which gates parsing on a `/application\/.+?\+?json/` regex) parses the body.
 */
export const agentContentTypeRewrite = async (c: Context, next: Next) => {
  const ct = c.req.header('content-type')?.toLowerCase() ?? '';
  if (!ct.startsWith(AGENT_CONTENT_TYPE)) {
    return next();
  }

  const headers = new Headers(c.req.raw.headers);
  headers.set('content-type', 'application/json');
  c.req.raw = new Request(c.req.raw, { headers });

  return next();
};
