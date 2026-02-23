import 'dotenv/config';

import adapterNode from '@sveltejs/adapter-node';
import adapterVercel from '@sveltejs/adapter-vercel';
import path from 'path';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const useNodeAdapter = process.env.PUBLIC_IS_SELFHOSTED === 'true';
const API_ORIGIN = process.env.PUBLIC_SERVER_URL;

/**
 * Parse comma-separated domain list from env.
 * Normalizes to https:// URLs. Returns null when env var is unset (use defaults).
 */
function parseDomainsFromEnv(envVar) {
  const value = process.env[envVar];
  if (!value || typeof value !== 'string') return null;
  return value
    .split(',')
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => (d.startsWith('http://') || d.startsWith('https://') ? d : `https://${d}`));
}

const ALLOWED_EXTERNAL_DOMAINS = parseDomainsFromEnv('ALLOWED_EXTERNAL_DOMAINS');
const ALLOWED_SCRIPT_SRC = parseDomainsFromEnv('CSP_SCRIPT_SRC_DOMAINS');
const ALLOWED_STYLE_SRC = parseDomainsFromEnv('CSP_STYLE_SRC_DOMAINS');
const ALLOWED_CONNECT_SRC = parseDomainsFromEnv('CSP_CONNECT_SRC_DOMAINS');
const ALLOWED_FRAME_SRC = parseDomainsFromEnv('CSP_FRAME_SRC_DOMAINS');
const ALLOWED_FONT_SRC = parseDomainsFromEnv('CSP_FONT_SRC_DOMAINS');

const defaultScriptSrcDomains = [
  'https://assets.cdn.clsrio.com',
  'https://cdnjs.cloudflare.com',
  'https://*.posthog.com',
  'https://*.senja.io',
  'https://www.youtube.com',
  'https://youtube.com',
  'https://google.com'
];
const defaultStyleSrcDomains = [
  'https://cdn.plyr.io',
  'https://unpkg.com/katex@0.12.0/dist/katex.min.css',
  'https://assets.cdn.clsrio.com/eqneditor_1.css',
  'https://fonts.googleapis.com'
];
const defaultConnectSrcDomains = [
  'https://*.classroomio.com',
  'https://classroomio.com',
  'https://app.classroomio.com',
  'https://api.classroomio.com',
  'https://pgrest.classroomio.com',
  'https://play.classroomio.com',
  'wss://*.classroomio.com',
  'https://assets.cdn.clsrio.com',
  'https://cdn.plyr.io',
  'https://*.posthog.com',
  'https://umami.hz.oncws.com',
  'https://*.r2.cloudflarestorage.com',
  'https://*.senja.io',
  'https://*.ytimg.com',
  'https://noembed.com'
];
const defaultFrameSrcDomains = [
  'https://www.youtube.com',
  'https://youtube.com',
  'https://www.youtube-nocookie.com',
  'https://www.google.com',
  'https://google.com'
];
const defaultFontSrcDomains = ['https://fonts.gstatic.com', 'https://cdn.plyr.io'];

// Self-hosted: use ONLY env vars, no defaults (strict CISO allowlists, data residency).
// SaaS: use defaults when env vars are unset (backward compatible).
const scriptSrcDomains = useNodeAdapter
  ? (ALLOWED_EXTERNAL_DOMAINS ?? ALLOWED_SCRIPT_SRC ?? [])
  : (ALLOWED_EXTERNAL_DOMAINS ?? ALLOWED_SCRIPT_SRC ?? defaultScriptSrcDomains);
const styleSrcDomains = useNodeAdapter
  ? (ALLOWED_EXTERNAL_DOMAINS ?? ALLOWED_STYLE_SRC ?? [])
  : (ALLOWED_EXTERNAL_DOMAINS ?? ALLOWED_STYLE_SRC ?? defaultStyleSrcDomains);
const connectSrcDomains = useNodeAdapter
  ? (ALLOWED_EXTERNAL_DOMAINS ?? ALLOWED_CONNECT_SRC ?? [])
  : (ALLOWED_EXTERNAL_DOMAINS ?? ALLOWED_CONNECT_SRC ?? defaultConnectSrcDomains);
const frameSrcDomains = useNodeAdapter
  ? (ALLOWED_EXTERNAL_DOMAINS ?? ALLOWED_FRAME_SRC ?? [])
  : (ALLOWED_EXTERNAL_DOMAINS ?? ALLOWED_FRAME_SRC ?? defaultFrameSrcDomains);
const fontSrcDomains = useNodeAdapter
  ? (ALLOWED_EXTERNAL_DOMAINS ?? ALLOWED_FONT_SRC ?? [])
  : (ALLOWED_EXTERNAL_DOMAINS ?? ALLOWED_FONT_SRC ?? defaultFontSrcDomains);

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
        'script-src': ['self', ...scriptSrcDomains, 'unsafe-hashes', 'unsafe-eval'],
        'style-src': ['self', 'unsafe-inline', ...styleSrcDomains],
        'style-src-elem': ['self', 'unsafe-inline', ...styleSrcDomains],
        'font-src': ['self', ...fontSrcDomains],
        'img-src': ['self', 'data:', 'https:', 'blob:'],
        'media-src': ['self', 'https:', 'data:', 'blob:'],
        'frame-src': ['self', ...frameSrcDomains],
        'connect-src': [
          'self',
          'blob:',
          'http://localhost:3002',
          ...(API_ORIGIN ? [API_ORIGIN] : []),
          ...connectSrcDomains
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
        'script-src': ['self', ...scriptSrcDomains, 'unsafe-hashes', 'unsafe-eval'],
        'style-src': ['self', 'unsafe-inline', ...styleSrcDomains],
        'style-src-elem': ['self', 'unsafe-inline', ...styleSrcDomains],
        'font-src': ['self', ...fontSrcDomains],
        'img-src': ['self', 'data:', 'https:', 'blob:'],
        'media-src': ['self', 'https:', 'data:', 'blob:'],
        'frame-src': ['self', ...frameSrcDomains],
        'connect-src': [
          'self',
          'blob:',
          'http://localhost:3002',
          ...(API_ORIGIN ? [API_ORIGIN] : []),
          ...connectSrcDomains
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
