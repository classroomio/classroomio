import { sentryVitePlugin } from '@sentry/vite-plugin';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';
import fs from 'fs';

export default ({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  return defineConfig({
    css: {
      preprocessorOptions: {
        scss: {
          silenceDeprecations: ['legacy-js-api'],
        },
      },
    },
    plugins: [sveltekit(), sentryVitePlugin(getSentryConfig(process.env))],
    server: getServer(process.env),
    build: {
      sourcemap: true
    },
    optimizeDeps: {
      entries: ['src/routes/**/+*.{js,ts,svelte}']
    }
  });
};

function getServer({ VITE_USE_HTTPS_ON_LOCALHOST }) {
  if (VITE_USE_HTTPS_ON_LOCALHOST === 'true') {
    return {
      https: {
        key: fs.readFileSync(`${__dirname}/cert/key.pem`),
        cert: fs.readFileSync(`${__dirname}/cert/cert.pem`)
      }
    };
  }
}

function getSentryConfig({
  VITE_SENTRY_AUTH_TOKEN,
  VITE_SENTRY_ORG_NAME,
  VITE_SENTRY_PROJECT_NAME
}) {
  if (VITE_SENTRY_AUTH_TOKEN) {
    return {
      url: 'https://sentry.io',
      authToken: VITE_SENTRY_AUTH_TOKEN,
      org: VITE_SENTRY_ORG_NAME,
      project: VITE_SENTRY_PROJECT_NAME
    };
  }
  return {};
}
