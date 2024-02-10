import { defineConfig, loadEnv } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import Sentry from 'sentry-vite-plugin';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import electron from 'vite-plugin-electron/simple';

export default ({ mode }: { mode: string }) => {
  const env = loadEnv(process.env.NODE_ENV, process.cwd());
  const { VITE_SENTRY_AUTH_TOKEN, VITE_SENTRY_ORG_NAME, VITE_SENTRY_PROJECT_NAME } = env;

  const plugins: Plugin<any>[] = [
    svelte(),
    nodeResolve({
      preferBuiltins: true
    }),
    commonjs(),
    electron({
      main: {
        // Shortcut of `build.lib.entry`
        entry: 'electron/main.ts'
      }
    })
  ];

  if (VITE_SENTRY_AUTH_TOKEN) {
    plugins.push(
      Sentry({
        include: './src',
        url: 'https://sentry.io',
        authToken: VITE_SENTRY_AUTH_TOKEN,
        org: VITE_SENTRY_ORG_NAME,
        project: VITE_SENTRY_PROJECT_NAME
      })
    );
  }

  return defineConfig({
    plugins,
    optimizeDeps: {
      exclude: ['module', 'electron', 'electron-serve', 'fs', 'path', 'process', 'os', 'semver']
    },
    build: {
      rollupOptions: {
        input: 'main.js'
      },
      sourcemap: true
    }
  });
};
