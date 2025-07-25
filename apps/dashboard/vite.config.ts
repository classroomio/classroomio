import { sveltekit } from '@sveltejs/kit/vite';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';

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
    server: getServer(process.env),
    build: {
      sourcemap: false,
      minify: 'esbuild',
      target: 'esnext',
      chunkSizeWarningLimit: 2000,
      // Performance optimizations
      reportCompressedSize: false,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Simple chunking without circular dependency issues
            if (id.includes('node_modules')) {
              if (id.includes('d3')) return 'vendor-d3';
              if (id.includes('carbon')) return 'vendor-carbon';
              if (id.includes('@supabase')) return 'vendor-supabase';
              if (id.includes('lodash') || id.includes('axios') || id.includes('zod'))
                return 'vendor-utils';
              return 'vendor';
            }
          }
        }
      }
    },
    optimizeDeps: {
      entries: ['src/routes/**/+*.{js,ts,svelte}'],
      // Reduced list - only the heaviest packages
      include: [
        '@supabase/supabase-js',
        'd3',
        'carbon-components-svelte',
        'carbon-icons-svelte',
        'lodash',
        'axios',
        'zod',
        'posthog-js',
        'stripe',
        'dayjs',
        'clsx',
        'tailwind-merge'
      ],
      exclude: [
        'body-parser',
        'cookie-parser',
        'bufferutil',
        'utf-8-validate',
        'encoding',
        'sirv',
        'wait-on'
      ],
      // Force pre-bundling
      force: true
    },
    resolve: {
      mainFields: ['browser', 'module', 'main']
    },
    esbuild: {
      target: 'esnext',
      treeShaking: true
    }
  });
};

function getServer(params: any) {
  const { VITE_USE_HTTPS_ON_LOCALHOST } = params || {};
  if (VITE_USE_HTTPS_ON_LOCALHOST === 'true') {
    return {
      https: {
        key: fs.readFileSync(`${__dirname}/cert/key.pem`),
        cert: fs.readFileSync(`${__dirname}/cert/cert.pem`)
      }
    };
  }
}
