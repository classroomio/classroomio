import type { Handle, RequestEvent } from '@sveltejs/kit';
import { buildPricingMarkdown } from '$lib/server/agent-resources';
import { DOCS_ORIGIN, HELP_ORIGIN } from '$lib/server/upstreams';
import { prefersMarkdown } from '$lib/utils/accept-header';
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

const DISCOVERY_LINK = '</llms.txt>; rel="describedby"; type="text/plain"';

export const handle: Handle = async ({ event, resolve }) => {
  const { pathname } = event.url;

  if (pathname === '/docs' || pathname.startsWith('/docs/')) {
    return proxy(DOCS_ORIGIN, pathname, event);
  }

  if (pathname === '/help' || pathname.startsWith('/help/')) {
    return proxy(HELP_ORIGIN, pathname, event);
  }

  if (pathname === '/pricing' && prefersMarkdown(event.request.headers.get('accept'))) {
    return new Response(buildPricingMarkdown(), {
      headers: { 'content-type': 'text/markdown; charset=utf-8', vary: 'Accept', link: DISCOVERY_LINK }
    });
  }

  const legacyTarget = resolveLegacyRedirect(pathname);
  if (legacyTarget) {
    const location = legacyTarget.startsWith('http') ? new URL(legacyTarget) : new URL(legacyTarget, event.url);
    location.search = event.url.search;

    const status = legacyTarget.startsWith('http') ? 308 : 301;

    return Response.redirect(location.toString(), status);
  }

  const resolved = await resolve(event);
  const response = new Response(resolved.body, resolved);
  response.headers.append('link', DISCOVERY_LINK);

  return response;
};
