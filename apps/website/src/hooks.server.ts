import type { Handle, RequestEvent } from '@sveltejs/kit';
import { buildPricingMarkdown } from '$lib/server/agent-resources';
import { DOCS_ORIGIN, HELP_ORIGIN } from '$lib/server/upstreams';
import { resolveLegacyRedirect } from '$lib/utils/legacy-redirects';

function proxy(origin: string, pathname: string, event: RequestEvent) {
  const upstream = new URL(pathname + event.url.search, origin);

  const headers = new Headers(event.request.headers);
  headers.delete('host');
  headers.set('x-forwarded-host', event.url.host);
  headers.set('x-forwarded-proto', 'https');

  const hasBody = event.request.method !== 'GET' && event.request.method !== 'HEAD';

  return fetch(upstream, {
    method: event.request.method,
    headers,
    body: hasBody ? event.request.body : undefined,
    redirect: 'manual'
  });
}

export const handle: Handle = async ({ event, resolve }) => {
  const { pathname } = event.url;

  if (pathname === '/docs' || pathname.startsWith('/docs/')) {
    return proxy(DOCS_ORIGIN, pathname, event);
  }

  if (pathname === '/help' || pathname.startsWith('/help/')) {
    return proxy(HELP_ORIGIN, pathname, event);
  }

  const wantsMarkdown = event.request.headers.get('accept')?.includes('text/markdown');
  if (pathname === '/pricing' && wantsMarkdown) {
    return new Response(buildPricingMarkdown(), {
      headers: { 'content-type': 'text/markdown; charset=utf-8', vary: 'Accept' }
    });
  }

  const legacyTarget = resolveLegacyRedirect(pathname);
  if (legacyTarget) {
    const location = legacyTarget.startsWith('http') ? new URL(legacyTarget) : new URL(legacyTarget, event.url);
    location.search = event.url.search;

    const status = legacyTarget.startsWith('http') ? 308 : 301;

    return Response.redirect(location.toString(), status);
  }

  return resolve(event);
};
