import { sentryVitePlugin } from '@sentry/vite-plugin';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';
import fs from 'fs';

export default ({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };
  const {
    VITE_SENTRY_AUTH_TOKEN,
    VITE_SENTRY_ORG_NAME,
    VITE_SENTRY_PROJECT_NAME,
    VITE_USE_HTTPS_ON_LOCALHOST
  } = process.env;

  return defineConfig({
    plugins: [
      sveltekit(),
      sentryVitePlugin(
        VITE_SENTRY_AUTH_TOKEN
          ? {
              url: 'https://sentry.io',
              authToken: VITE_SENTRY_AUTH_TOKEN,
              org: VITE_SENTRY_ORG_NAME,
              project: VITE_SENTRY_PROJECT_NAME
            }
          : {}
      )
    ],
    server:
      VITE_USE_HTTPS_ON_LOCALHOST === 'true'
        ? {
            https: {
              key: fs.readFileSync(`${__dirname}/cert/key.pem`),
              cert: fs.readFileSync(`${__dirname}/cert/cert.pem`)
            }
          }
        : undefined,
    build: {
      sourcemap: true
    }
  });
};
