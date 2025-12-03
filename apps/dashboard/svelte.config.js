import 'dotenv/config';

import adapterNode from '@sveltejs/adapter-node';
import adapterVercel from '@sveltejs/adapter-vercel';
import path from 'path';
import { vitePreprocess } from '@sveltejs/kit/vite';

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
      $mail: path.resolve('./src/mail')
    },
    csp: {
      directives: {
        'default-src': ['self'],
        'script-src': [
          'self',
          'https://assets.cdn.clsrio.com',
          'https://cdnjs.cloudflare.com',
          'https://eu-assets.i.posthog.com'
        ],
        'style-src': [
          'self',
          'unsafe-inline',
          'https://cdn.plyr.io',
          'https://unpkg.com/katex@0.12.0/dist/katex.min.css',
          'https://assets.cdn.clsrio.com/eqneditor_1.css'
        ],
        'style-src-elem': [
          'self',
          'unsafe-inline',
          'https://cdn.plyr.io',
          'https://unpkg.com/katex@0.12.0/dist/katex.min.css',
          'https://assets.cdn.clsrio.com/eqneditor_1.css'
        ],
        'font-src': ['self', 'https://fonts.gstatic.com', 'https://cdn.plyr.io'],
        'img-src': ['self', 'data:', 'https:'],
        'frame-src': ['self', 'https://www.youtube.com', 'https://youtube.com'],
        'connect-src': [
          'self',
          'https://*.supabase.co',
          'https://pgrest.classroomio.com',
          'https://assets.cdn.clsrio.com',
          'https://cdn.plyr.io',
          'https://eu.i.posthog.com',
          'https://umami.hz.oncws.com',
          'http://localhost:54321',
          'ws://localhost:54321',
          'wss://*.classroomio.com',
          'wss://*.supabase.co'
        ],
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
          'https://eu-assets.i.posthog.com'
        ],
        'style-src': [
          'self',
          'unsafe-inline',
          'https://cdn.plyr.io',
          'https://unpkg.com/katex@0.12.0/dist/katex.min.css',
          'https://assets.cdn.clsrio.com/eqneditor_1.css'
        ],
        'style-src-elem': [
          'self',
          'unsafe-inline',
          'https://cdn.plyr.io',
          'https://unpkg.com/katex@0.12.0/dist/katex.min.css',
          'https://assets.cdn.clsrio.com/eqneditor_1.css'
        ],
        'font-src': ['self', 'https://fonts.gstatic.com', 'https://cdn.plyr.io'],
        'img-src': ['self', 'data:', 'https:'],
        'frame-src': ['self', 'https://www.youtube.com', 'https://youtube.com'],
        'connect-src': [
          'self',
          'https://*.supabase.co',
          'https://pgrest.classroomio.com',
          'https://assets.cdn.clsrio.com',
          'https://cdn.plyr.io',
          'https://eu.i.posthog.com',
          'https://umami.hz.oncws.com',
          'http://localhost:54321',
          'ws://localhost:54321',
          'wss://*.supabase.co',
          'wss://*.classroomio.com'
        ],
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
