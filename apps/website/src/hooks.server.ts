import type { Handle, RequestEvent } from '@sveltejs/kit';
import { resolveLegacyRedirect } from '$lib/utils/legacy-redirects';

const DOCS_ORIGIN = 'https://cio-docs.digdippa.workers.dev';
const HELP_ORIGIN = 'https://cio-help.digdippa.workers.dev';

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

const DOCS_LLMS_SECTION = `

## Developer docs

- [Developer docs index](https://classroomio.com/docs/llms.txt): API reference, MCP, OAuth, webhooks, token auth, self-hosting and contributing guides.
`;

async function serveLlmsTxt(event: RequestEvent) {
  const upstream = await proxy(HELP_ORIGIN, '/help/llms.txt', event);
  if (!upstream.ok) return upstream;

  const helpIndex = await upstream.text();
  const headers = new Headers({ 'content-type': 'text/plain; charset=utf-8' });

  return new Response(helpIndex.trimEnd() + DOCS_LLMS_SECTION, { status: 200, headers });
}

export const handle: Handle = async ({ event, resolve }) => {
  const { pathname } = event.url;

  if (pathname === '/docs' || pathname.startsWith('/docs/')) {
    return proxy(DOCS_ORIGIN, pathname, event);
  }

  if (pathname === '/llms.txt') {
    return serveLlmsTxt(event);
  }

  if (pathname === '/help' || pathname.startsWith('/help/')) {
    return proxy(HELP_ORIGIN, pathname, event);
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
