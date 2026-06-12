import { EMBED_WIDGET_ROUTES } from '@cio/utils/constants/embeds';

const EMBED_CONTENT_TYPES: Record<string, string> = {
  html: 'text/html',
  js: 'application/javascript',
  mjs: 'application/javascript',
  json: 'application/json',
  css: 'text/css',
  map: 'application/json',
  txt: 'text/plain'
};

function contentTypeForObjectKey(objectKey: string): string {
  const dot = objectKey.lastIndexOf('.');
  if (dot === -1) return 'application/octet-stream';
  const ext = objectKey.slice(dot + 1).toLowerCase();

  return EMBED_CONTENT_TYPES[ext] ?? 'application/octet-stream';
}

function isBootstrapScriptKey(objectKey: string): boolean {
  return Object.values(EMBED_WIDGET_ROUTES).some((route) => route.scriptKey === objectKey);
}

function cacheControlForObjectKey(objectKey: string): string {
  if (objectKey.endsWith('.html')) {
    return 'public, max-age=300';
  }

  if (/\.(js|mjs)$/.test(objectKey)) {
    if (isBootstrapScriptKey(objectKey)) {
      return 'public, max-age=300, must-revalidate';
    }

    return 'public, max-age=31536000, immutable';
  }

  if (objectKey.endsWith('.css')) {
    return 'public, max-age=3600';
  }

  return 'public, max-age=3600';
}

function resolvePublicWidgetKey(pathname: string, searchParams: URLSearchParams): string | null {
  const route = EMBED_WIDGET_ROUTES[pathname as keyof typeof EMBED_WIDGET_ROUTES];
  if (!route) {
    return null;
  }

  if ('pageKey' in route) {
    const pageParam = 'pageQueryParam' in route && route.pageQueryParam ? route.pageQueryParam : 'key';
    if (route.pageKey && searchParams.has(pageParam)) {
      return route.pageKey;
    }
  }

  return route.scriptKey;
}

export async function resolveEmbedObjectKey(url: URL, assetsBucket: R2Bucket): Promise<string | null> {
  const pathname = url.pathname.replace(/^\/+/, '').replace(/\/+$/, '');
  if (!pathname || pathname.includes('..')) {
    return null;
  }

  // Internal paths for lazy chunks (browser-loaded, not customer-facing).
  if (pathname.startsWith('embeds/')) {
    return pathname;
  }

  if (!pathname.includes('/')) {
    const publicKey = resolvePublicWidgetKey(pathname, url.searchParams);
    if (publicKey) {
      return publicKey;
    }

    for (const widgetName of Object.keys(EMBED_WIDGET_ROUTES)) {
      const candidate = `embeds/${widgetName}/${pathname}`;
      const head = await assetsBucket.head(candidate);
      if (head) {
        return candidate;
      }
    }
  }

  return null;
}

export function needsApiUrlInjection(objectKey: string): boolean {
  return isBootstrapScriptKey(objectKey) || objectKey.endsWith('/embed.html');
}

export function injectApiUrl(body: string, objectKey: string, apiUrl: string): string {
  if (!needsApiUrlInjection(objectKey)) {
    return body;
  }

  const normalizedApiUrl = apiUrl.replace(/\/$/, '');
  const snippet = `window.CIO=window.CIO||{};window.CIO.apiBaseUrl=${JSON.stringify(normalizedApiUrl)};`;

  if (objectKey.endsWith('.html')) {
    return body.replace('<head>', `<head>\n    <script>${snippet}</script>`);
  }

  return `${snippet}\n${body}`;
}

export function embedResponseHeaders(objectKey: string): Headers {
  const headers = new Headers();
  headers.set('Content-Type', contentTypeForObjectKey(objectKey));
  headers.set('Cache-Control', cacheControlForObjectKey(objectKey));
  headers.set('Access-Control-Allow-Origin', '*');

  return headers;
}
