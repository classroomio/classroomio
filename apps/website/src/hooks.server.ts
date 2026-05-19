import type { Handle } from '@sveltejs/kit';

const DOCS_ORIGIN = 'https://cio-docs.digdippa.workers.dev';

export const handle: Handle = async ({ event, resolve }) => {
  const { pathname } = event.url;

  if (pathname === '/docs' || pathname.startsWith('/docs/')) {
    const upstream = new URL(pathname + event.url.search, DOCS_ORIGIN);

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

  return resolve(event);
};
