import { buildProxiedApiResponse } from './proxy-api-request';

const INGEST_PREFIX = '/ingest';
const API_HOST = 'eu.i.posthog.com';
const ASSET_HOST = 'eu-assets.i.posthog.com';

export function shouldForwardToPosthog(pathname: string): boolean {
  return pathname === INGEST_PREFIX || pathname.startsWith(`${INGEST_PREFIX}/`);
}

export async function proxyRequestToPosthog(request: Request): Promise<Response> {
  const upstreamUrl = new URL(request.url);
  const upstreamPath = upstreamUrl.pathname.slice(INGEST_PREFIX.length) || '/';
  const isAsset = upstreamPath.startsWith('/static/') || upstreamPath.startsWith('/array/');
  upstreamUrl.protocol = 'https:';
  upstreamUrl.host = isAsset ? ASSET_HOST : API_HOST;
  upstreamUrl.port = '';
  upstreamUrl.pathname = upstreamPath;

  const headers = new Headers();
  for (const name of ['accept', 'content-type', 'content-encoding', 'user-agent']) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set('accept-encoding', 'identity');

  const clientIp = request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for');
  if (clientIp) headers.set('x-forwarded-for', clientIp);

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: 'manual'
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.arrayBuffer();
  }

  const upstreamResponse = await fetch(upstreamUrl, init);
  const response = buildProxiedApiResponse(upstreamResponse);
  response.headers.delete('set-cookie');

  return response;
}
