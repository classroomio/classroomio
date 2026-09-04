import { defineConfig } from 'blume';
import { z } from 'zod';

/**
 * The site is served at classroomio.com/docs, proxied to this worker by the
 * marketing site (apps/website/src/hooks.server.ts). `deployment.base` only
 * rewrites URLs in the emitted HTML — it does not nest the build output, so
 * scripts/package-assets.mjs moves dist/ under docs/ to match the served path.
 *
 * Most redirects still live in scripts/package-assets.mjs as a manual
 * `_redirects` file, since Blume's own `redirects` only matches exact paths —
 * no wildcards — and most of ours are `/old/*` splat rules. The one exact-path
 * redirect below (root → /developers) IS declared here rather than only in
 * that file: `_redirects` is a Cloudflare-only static file with no effect on
 * `blume dev`, and this one needs to work locally too. Blume used to
 * mis-apply `deployment.base` to a redirect's destination (fixed in 1.1.0;
 * this project runs 1.2.0), which is why the manual-file-only approach was
 * adopted in the first place — safe to use natively now for exact paths.
 */
export default defineConfig({
  title: 'ClassroomIO Docs | Customer, Partner, and Employee Education',
  description:
    'Learn how to create customer academies, partner certification programs, and employee training workflows in ClassroomIO.',
  logo: {
    text: 'ClassroomIO',
    image: '/docs/logo-192.png',
    href: '/docs'
  },
  content: {
    root: 'content/docs'
  },
  deployment: {
    output: 'static',
    site: 'https://classroomio.com',
    base: '/docs'
  },
  redirects: [{ from: '/', to: '/developers', status: 301 }],
  github: {
    owner: 'classroomio',
    repo: 'classroomio',
    dir: 'apps/docs'
  },
  theme: {
    mode: 'system'
  },
  // `last_reviewed` is the staleness field CONTRIBUTING.md asks authors to add
  // and scripts/check-stale-docs.mjs reads. Blume's page frontmatter schema is
  // strict, so without this it fails the build on any page that sets it.
  frontmatter: {
    extend: {
      last_reviewed: z.string().optional()
    }
  },
  search: {
    provider: 'orama'
  },
  ai: {
    llmsTxt: true
  },
  seo: {
    x: {
      creator: '@classroomio',
      handle: '@classroomio'
    }
  },
  openapi: {
    enabled: true,
    renderer: 'scalar',
    route: '/api',
    sources: [{ label: 'API', spec: './openapi/public-api.json' }]
  },
  navigation: {
    tabs: [
      { label: 'Help Center', path: 'https://classroomio.com/help', icon: 'book-open' },
      // path stays '/' so this tab spans the whole tree (per Blume's tab-scoping
      // rule) instead of scoping the sidebar to only /developers/* — but an
      // explicit href still sends clicks to the actual Developers overview page
      // instead of falling back to the site root.
      { label: 'Developers', path: '/', href: '/developers', icon: 'terminal' },
      { label: 'API', path: '/api', icon: 'code' }
    ],
    sidebar: [
      // Explicit '/developers' (not the bare '/' shorthand): a bare '/' item
      // resolves to the literal site root page, not this section's own index —
      // that mismatch previously put a page titled "Welcome to ClassroomIO"
      // as the first entry under the Developers heading.
      '/developers',
      {
        // Not "Integrations" — that collides with the existing
        // /self-hosted/configuration/integrations page title.
        label: 'Connect',
        display: 'group',
        collapsed: false,
        items: ['/developers/mcp', '/developers/token-auth']
      },
      {
        label: 'Self-hosting',
        root: '/self-hosted',
        items: [
          '/self-hosted',
          '/self-hosted/101',
          '/self-hosted/architecture',
          {
            label: 'Install',
            display: 'group',
            collapsed: false,
            items: [
              '/self-hosted/docker',
              '/self-hosted/digitalocean',
              '/self-hosted/railway',
              '/self-hosted/coolify',
              '/self-hosted/dokploy'
            ]
          },
          {
            label: 'Configure',
            display: 'group',
            collapsed: true,
            items: [
              '/self-hosted/configuration',
              '/self-hosted/configuration/secrets',
              '/self-hosted/configuration/email',
              '/self-hosted/configuration/storage',
              '/self-hosted/configuration/csp',
              '/self-hosted/configuration/integrations',
              '/self-hosted/configuration/ai',
              '/self-hosted/enterprise'
            ]
          },
          {
            label: 'Manage',
            display: 'group',
            collapsed: true,
            items: ['/self-hosted/configuration/versions', '/self-hosted/backups']
          },
          {
            label: 'Troubleshoot',
            display: 'group',
            collapsed: true,
            items: ['/self-hosted/troubleshooting']
          }
        ]
      },
      {
        label: 'Contributing',
        display: 'group',
        collapsed: false,
        items: [
          '/contributing',
          '/contributing/devs',
          '/contributing/cloudflare-setup',
          '/contributing/org-site-opengraph-and-favicon',
          '/contributing/gitpod',
          '/contributing/demo-accounts',
          '/contributing/student-dashboard',
          '/contributing/adding-translation-to-code'
        ]
      }
    ]
  }
});
