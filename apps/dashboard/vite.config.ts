import { defineConfig, loadEnv } from 'vite';

import fs from 'fs';
import { sveltekit } from '@sveltejs/kit/vite';

export default ({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  return defineConfig({
    css: {
      preprocessorOptions: {
        scss: {
          silenceDeprecations: ['legacy-js-api']
        }
      }
    },
    plugins: [sveltekit()],
    server: {
      ...getServer(process.env),
      watch: {
        ignored: ['**/node_modules/!(@cio)/**', '**/.git/**']
      }
    },
    build: {
      sourcemap: false
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
      include: ['@cio/api/rpc-types'],
      // Workspace packages must be processed by Svelte/Vite (not pre-bundled)
      // so HMR fires when editing files under packages/*.
      exclude: ['@cio/ui', '@cio/utils', '@cio/question-types']
    },
    resolve: {
      mainFields: ['browser']
    }
  });
};

function getServer(params) {
  const { VITE_USE_HTTPS_ON_LOCALHOST } = params || {};
  if (VITE_USE_HTTPS_ON_LOCALHOST === 'true') {
    return {
      https: {
        key: fs.readFileSync(`${__dirname}/cert/key.pem`),
        cert: fs.readFileSync(`${__dirname}/cert/cert.pem`)
      }
    };
  }

  return {
    allowedHosts: []
  };
}

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
