import 'dotenv/config';

import adapterAuto from '@sveltejs/adapter-auto';
import adapterNode from '@sveltejs/adapter-node';
import path from 'path';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { getCspDomains } from './src/lib/utils/csp-domains.js';

const isSelfHosted = process.env.PUBLIC_IS_SELFHOSTED === 'true';
const IS_CLOUDFLARE = process.env.CI_ENVIRONMENT === 'cloudflare';

const adapterCloudflare = IS_CLOUDFLARE ? (await import('@sveltejs/adapter-cloudflare')).default : null;
const csp = getCspDomains(isSelfHosted, process.env.PUBLIC_SERVER_URL);

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: [vitePreprocess({})],
  kit: {
    adapter: IS_CLOUDFLARE ? adapterCloudflare() : isSelfHosted ? adapterNode() : adapterAuto(),
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
        'script-src': ['self', ...csp.scriptSrc, 'unsafe-hashes', 'unsafe-eval'],
        'style-src': ['self', 'unsafe-inline', ...csp.styleSrc],
        'style-src-elem': ['self', 'unsafe-inline', ...csp.styleSrc],
        'font-src': ['self', ...csp.fontSrc],
        'img-src': ['self', 'data:', ...csp.mediaSrc, 'blob:', 'http://localhost:9000'],
        'media-src': ['self', ...csp.mediaSrc, 'data:', 'blob:', 'http://localhost:9000'],
        'frame-src': ['self', ...csp.frameSrc],
        'connect-src': [
          'self',
          'blob:',
          'http://localhost:3002',
          'http://localhost:9000',
          ...(csp.apiOrigin ? [csp.apiOrigin] : []),
          ...csp.connectSrc
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
        'script-src': ['self', ...csp.scriptSrc, 'unsafe-hashes', 'unsafe-eval'],
        'style-src': ['self', 'unsafe-inline', ...csp.styleSrc],
        'style-src-elem': ['self', 'unsafe-inline', ...csp.styleSrc],
        'font-src': ['self', ...csp.fontSrc],
        'img-src': ['self', 'data:', ...csp.mediaSrc, 'blob:', 'http://localhost:9000'],
        'media-src': ['self', ...csp.mediaSrc, 'data:', 'blob:', 'http://localhost:9000'],
        'frame-src': ['self', ...csp.frameSrc],
        'connect-src': [
          'self',
          'blob:',
          'http://localhost:3002',
          'http://localhost:9000',
          ...(csp.apiOrigin ? [csp.apiOrigin] : []),
          ...csp.connectSrc
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
