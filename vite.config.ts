import { sentryVitePlugin } from '@sentry/vite-plugin';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';

export default ({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  return defineConfig({
    plugins: [
      sveltekit(),
      sentryVitePlugin({
        url: 'https://sentry.io',
        authToken: process.env.VITE_SENTRY_AUTH_TOKEN,
        org: 'the-next-greats',
        project: 'classroomio'
      })
    ],
    build: {
      sourcemap: true
    }
  });
};
