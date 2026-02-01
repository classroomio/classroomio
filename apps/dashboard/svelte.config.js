import 'dotenv/config';

import adapterNode from '@sveltejs/adapter-node';
import adapterVercel from '@sveltejs/adapter-vercel';
import path from 'path';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const useNodeAdapter = process.env.PUBLIC_IS_SELFHOSTED === 'true';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors
  preprocess: [vitePreprocess({})],
  kit: {
    adapter: useNodeAdapter ? adapterNode() : adapterVercel(),
    alias: {
      $lib: path.resolve('./src/lib'),
      $features: path.resolve('./src/lib/features'),
      $mail: path.resolve('./src/mail'),
      '$src/tools': path.resolve('./node_modules/@cio/ui/src/tools/index.ts'),
      '$src/base/*': path.resolve('./node_modules/@cio/ui/src/base/*'),
      '@cio/ui': path.resolve('./node_modules/@cio/ui/src'),
      '@cio/ui/*': path.resolve('./node_modules/@cio/ui/src/*'),
      '@cio/api': path.resolve('./node_modules/@cio/api/dist'),
      '@cio/api/*': path.resolve('./node_modules/@cio/api/dist/*'),
      '@cio/utils': path.resolve('./node_modules/@cio/utils/dist'),
      '@cio/utils/*': path.resolve('./node_modules/@cio/utils/dist/*'),
      '@cio/db/types': path.resolve('./node_modules/@cio/db/src/types.ts')
    },
    csp: {
      mode: 'auto',
      directives: {
        'default-src': ['self'],
        'script-src': [
          'self',
          'https://assets.cdn.clsrio.com',
          'https://cdnjs.cloudflare.com',
          'https://*.i.posthog.com',
          'https://*.senja.io',
          'https://www.youtube.com',
          'https://youtube.com',
          'https://google.com',
          'unsafe-hashes',
          'unsafe-eval'
        ],
        'style-src': [
          'self',
          'unsafe-inline',
          'https://cdn.plyr.io',
          'https://unpkg.com/katex@0.12.0/dist/katex.min.css',
          'https://assets.cdn.clsrio.com/eqneditor_1.css',
          'https://fonts.googleapis.com'
        ],
        'style-src-elem': [
          'self',
          'unsafe-inline',
          'https://cdn.plyr.io',
          'https://unpkg.com/katex@0.12.0/dist/katex.min.css',
          'https://assets.cdn.clsrio.com/eqneditor_1.css',
          'https://fonts.googleapis.com'
        ],
        'font-src': ['self', 'https://fonts.gstatic.com', 'https://cdn.plyr.io'],
        'img-src': ['self', 'data:', 'https:', 'blob:'],
        'media-src': ['self', 'https:', 'data:'],
        'frame-src': [
          'self',
          'https://www.youtube.com',
          'https://youtube.com',
          'https://www.youtube-nocookie.com',
          'https://www.google.com',
          'https://google.com'
        ],
        'connect-src': [
          'self',
          'blob:',
          'https://*.classroomio.com',
          'https://assets.cdn.clsrio.com',
          'https://cdn.plyr.io',
          'https://*.i.posthog.com',
          'https://umami.hz.oncws.com',
          'https://*.r2.cloudflarestorage.com',
          'http://localhost:3002',
          'wss://*.classroomio.com',
          'https://*.senja.io',
          'https://*.ytimg.com',
          'https://noembed.com'
        ],
        'worker-src': ['self', 'blob:'],
        'object-src': ['none'],
        'base-uri': ['self'],
        'form-action': ['self'],
        'frame-ancestors': ['none'],
        'upgrade-insecure-requests': true
      },
      reportOnly: {
        'default-src': ['self'],
        'script-src': [
          'self',
          'https://assets.cdn.clsrio.com',
          'https://cdnjs.cloudflare.com',
          'https://*.i.posthog.com',
          'https://*.senja.io',
          'https://www.youtube.com',
          'https://youtube.com',
          'https://google.com',
          'unsafe-hashes',
          'unsafe-eval'
        ],
        'style-src': [
          'self',
          'unsafe-inline',
          'https://cdn.plyr.io',
          'https://unpkg.com/katex@0.12.0/dist/katex.min.css',
          'https://assets.cdn.clsrio.com/eqneditor_1.css',
          'https://fonts.googleapis.com'
        ],
        'style-src-elem': [
          'self',
          'unsafe-inline',
          'https://cdn.plyr.io',
          'https://unpkg.com/katex@0.12.0/dist/katex.min.css',
          'https://assets.cdn.clsrio.com/eqneditor_1.css',
          'https://fonts.googleapis.com'
        ],
        'font-src': ['self', 'https://fonts.gstatic.com', 'https://cdn.plyr.io'],
        'img-src': ['self', 'data:', 'https:', 'blob:'],
        'media-src': ['self', 'https:', 'data:'],
        'frame-src': [
          'self',
          'https://www.youtube.com',
          'https://youtube.com',
          'https://www.youtube-nocookie.com',
          'https://www.google.com',
          'https://google.com'
        ],
        'connect-src': [
          'self',
          'blob:',
          'https://pgrest.classroomio.com',
          'https://api.classroomio.com',
          'https://assets.cdn.clsrio.com',
          'https://cdn.plyr.io',
          'https://*.i.posthog.com',
          'https://umami.hz.oncws.com',
          'https://*.r2.cloudflarestorage.com',
          'http://localhost:3002',
          'wss://*.classroomio.com',
          'https://*.senja.io',
          'https://*.ytimg.com',
          'https://noembed.com'
        ],
        'worker-src': ['self', 'blob:'],
        'object-src': ['none'],
        'base-uri': ['self'],
        'form-action': ['self'],
        'frame-ancestors': ['none'],
        'report-uri': ['/csp-report']
      }
    }
  }
};

export default config;
