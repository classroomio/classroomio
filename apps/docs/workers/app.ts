import { createRequestHandler } from 'react-router';

declare module 'react-router' {
  export interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}

const requestHandler = createRequestHandler(
  () => import('virtual:react-router/server-build'),
  import.meta.env.MODE
);

const BASENAME = '/docs';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // The app is built with base: '/docs', so HTML references assets at
    // /docs/assets/... and /docs/*.webp, but the ASSETS binding only knows
    // about the flat build/client/ layout. Re-fetch with the prefix stripped
    // so static files resolve before we fall through to SSR.
    if (url.pathname.startsWith(`${BASENAME}/`)) {
      const strippedUrl = new URL(url);
      strippedUrl.pathname = url.pathname.slice(BASENAME.length);

      const assetResponse = await env.ASSETS.fetch(new Request(strippedUrl, request));
      if (assetResponse.status !== 404) {
        return assetResponse;
      }
    }

    return requestHandler(request, {
      cloudflare: { env, ctx }
    });
  }
} satisfies ExportedHandler<Env>;
