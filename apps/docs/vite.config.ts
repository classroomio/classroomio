import { defineConfig } from 'vite';
import mdx from 'fumadocs-mdx/vite';
import { reactRouter } from '@react-router/dev/vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import tsConfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  server: {
    host: '127.0.0.1',
    port: 3000
  },
  base: '/docs',
  plugins: [
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    mdx(await import('./source.config')),
    tailwindcss(),
    tsConfigPaths({
      projects: ['./tsconfig.json']
    }),
    reactRouter()
  ]
});
