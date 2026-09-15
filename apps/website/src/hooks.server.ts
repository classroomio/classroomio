import type { Handle, RequestEvent } from '@sveltejs/kit';

const DOCS_ORIGIN = 'https://cio-docs.digdippa.workers.dev';
const HELP_ORIGIN = 'https://cio-help.digdippa.workers.dev';
const HTML_CACHE_TTL_SECONDS = 60 * 60;

type EdgeCache = {
  match(request: Request): Promise<Response | null>;
  put(request: Request, response: Response): Promise<void>;
};

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

function getEdgeCache(): EdgeCache | null {
  if (typeof caches === 'undefined') {
    return null;
  }

  return (caches as unknown as { default?: EdgeCache }).default ?? null;
}

export const handle: Handle = async ({ event, resolve }) => {
  const { pathname } = event.url;

  if (pathname === '/docs' || pathname.startsWith('/docs/')) {
    return proxy(DOCS_ORIGIN, pathname, event);
  }

  if (pathname === '/help' || pathname.startsWith('/help/')) {
    return proxy(HELP_ORIGIN, pathname, event);
  }

  const cache = event.request.method === 'GET' && !pathname.startsWith('/api/') ? getEdgeCache() : null;

  if (cache) {
    const cached = await cache.match(event.request);

    if (cached) {
      return cached;
    }
  }

  const response = await resolve(event);

  const isHtml = response.headers.get('content-type')?.includes('text/html') ?? false;

  if (cache && response.status === 200 && isHtml && !response.headers.has('set-cookie')) {
    const edgeCopy = response.clone();
    edgeCopy.headers.set('cache-control', `public, max-age=${HTML_CACHE_TTL_SECONDS}`);

    try {
      await cache.put(event.request, edgeCopy);
    } catch {}
  }

  return response;
};
