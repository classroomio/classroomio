import { sentryVitePlugin } from '@sentry/vite-plugin';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';

export default ({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };
  const { VITE_SENTRY_AUTH_TOKEN, VITE_SENTRY_ORG_NAME, VITE_SENTRY_PROJECT_NAME } = process.env;

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
    build: {
      sourcemap: true
    }
  });
};
