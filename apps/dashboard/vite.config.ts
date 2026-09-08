import { defineConfig, loadEnv } from 'vite';

import { sveltekit } from '@sveltejs/kit/vite';
import mkcert from 'vite-plugin-mkcert';

export default ({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };
  const useHttps = process.env.HTTPS === 'true' || process.env.VITE_USE_HTTPS_ON_LOCALHOST === 'true';
  const host = process.env.HOST || (useHttps ? '0.0.0.0' : undefined);

  return defineConfig({
    css: {
      preprocessorOptions: {
        scss: {
          silenceDeprecations: ['legacy-js-api']
        }
      }
    },
    plugins: [sveltekit(), ...(useHttps ? [mkcert()] : [])],
    server: {
      host,
      fs: {
        // `..` is `apps/` — covers the dashboard's own files. `../../packages`
        // is required so Vite's `@fs` route can serve dynamic imports that
        // workspace packages (e.g. `@cio/ui/custom/editor`) emit as absolute
        // paths into their own source tree. Without it, dev 403s on those
        // `@fs/.../packages/ui/...` URLs.
        allow: ['..', '../../packages']
      },
      watch: {
        ignored: ['**/node_modules/!(@cio)/**', '**/.git/**']
      }
    },
    build: {
      sourcemap: true,
      target: 'es2020'
    },
    ssr: {
      // svelte-motion uses directory imports without `/index.js`; Node ESM fails unless bundled for SSR.
      noExternal: [
        'svelte-sonner',
        'layerchart',
        'svelte-toolbelt',
        'tldts',
        'tldts-core',
        'svelte-motion',
        'svelte-inview'
      ]
    },
    optimizeDeps: {
      entries: ['src/routes/**/+*.{js,ts,svelte}'],
      include: [
        '@cio/api/rpc-types',
        // Pre-bundle layerchart via esbuild so its internal circular dependencies
        // are flattened before Vite SSR evaluates them. Without this, Vite's SSR
        // transform hits a "not yet fully initialized" circular-dep error.
        'layerchart'
      ],
      // Workspace packages must be processed by Svelte/Vite (not pre-bundled)
      // so HMR fires when editing files under packages/*.
      exclude: ['@cio/ui', '@cio/utils', '@cio/question-types']
    },
    resolve: {
      mainFields: ['browser']
    }
  });
};

// function getSentryConfig(params: any) {
//   const { VITE_SENTRY_AUTH_TOKEN, VITE_SENTRY_ORG_NAME, VITE_SENTRY_PROJECT_NAME } = params || {};
//   if (VITE_SENTRY_AUTH_TOKEN) {
//     return {
//       url: 'https://sentry.io',
//       authToken: VITE_SENTRY_AUTH_TOKEN,
//       org: VITE_SENTRY_ORG_NAME,
//       project: VITE_SENTRY_PROJECT_NAME,
//       options: {
//         telemetry: false,
//       }
//     };
//   }
//   return {};
// }
