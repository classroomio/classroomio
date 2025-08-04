import { sveltekit } from '@sveltejs/kit/vite';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';

export default ({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  // Check if we're on a memory-constrained environment
  const isMemoryConstrained = process.env.NODE_OPTIONS?.includes('--max-old-space-size=1536');

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
      // Performance optimizations for EC2
      reportCompressedSize: false,
      // Reduce memory usage during build
      emptyOutDir: true,
      rollupOptions: {
        // Disable manual chunking to avoid transformation issues
        output: {
          manualChunks: undefined
        }
      }
    },
    optimizeDeps: {
      entries: ['src/routes/**/+*.{js,ts,svelte}'],
      // Minimal list to avoid transformation issues
      include: [
        '@supabase/supabase-js',
        'carbon-components-svelte',
        'carbon-icons-svelte',
        'lodash',
        'axios',
        'zod'
      ],
      exclude: [
        'body-parser',
        'cookie-parser',
        'bufferutil',
        'utf-8-validate',
        'encoding',
        'sirv',
        'wait-on',
        // Exclude heavy packages that cause transformation issues
        'd3',
        'd3-cloud',
        'd3-sankey',
        'html-to-image',
        'jspdf',
        'jspdf-autotable',
        'canvas-confetti',
        'papaparse',
        'qrcode',
        'posthog-js',
        'stripe',
        'openai-edge',
        'ai',
        'unsplash-js'
      ],
      // Disable pre-bundling to avoid transformation issues
      force: false
    },
    resolve: {
      mainFields: ['browser', 'module', 'main']
    },
    esbuild: {
      target: 'esnext',
      treeShaking: true,
      // Optimize for memory usage
      minifyIdentifiers: true,
      minifySyntax: true,
      minifyWhitespace: true
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
