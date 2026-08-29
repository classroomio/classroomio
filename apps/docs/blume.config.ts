import { defineConfig } from 'blume';

/**
 * The site is served at classroomio.com/docs, proxied to this worker by the
 * marketing site (apps/website/src/hooks.server.ts). `deployment.base` only
 * rewrites URLs in the emitted HTML — it does not nest the build output, so
 * scripts/package-assets.mjs moves dist/ under docs/ to match the served path.
 *
 * Redirects are NOT declared here: under a base, Astro prefixes a redirect's
 * source but not its target, so it would emit `url=/developers/mcp` instead
 * of `/docs/developers/mcp`. They live in scripts/package-assets.mjs as a
 * `_redirects` file.
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
  github: {
    owner: 'classroomio',
    repo: 'classroomio',
    dir: 'apps/docs'
  },
  theme: {
    mode: 'system'
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
      { label: 'Platform', path: '/', icon: 'house' },
      { label: 'Developers', path: '/developers', icon: 'terminal' },
      { label: 'Self-Hosting', path: '/self-hosted', icon: 'server' },
      { label: 'API', path: '/api', icon: 'code' }
    ],
    sidebar: [
      {
        label: 'Platform',
        items: [
          '/',
          {
            label: 'Quickstart',
            items: ['/quickstart/signup', '/quickstart/onboarding']
          },
          {
            label: 'Introduction',
            items: ['/what-is-classroomio', '/terminology']
          },
          {
            label: 'Features',
            items: [
              '/course',
              '/cohorts',
              '/tags',
              '/audience',
              '/community',
              '/organization',
              '/student-dashboard',
              '/enterprise-sso'
            ]
          }
        ]
      },
      {
        label: 'Developers',
        root: '/developers',
        items: [
          '/developers',
          {
            label: 'Build with the API',
            items: ['/developers/mcp', '/developers/token-auth']
          },
          {
            label: 'Contributor Guides',
            items: [
              '/developers/contributing',
              '/developers/contributing/devs',
              '/developers/contributing/cloudflare-setup',
              '/developers/contributing/org-site-opengraph-and-favicon',
              '/developers/contributing/gitpod',
              '/developers/contributing/demo-accounts',
              '/developers/contributing/student-dashboard',
              '/developers/contributing/adding-translation-to-code'
            ]
          }
        ]
      },
      {
        label: 'Self-Hosting',
        root: '/self-hosted',
        items: [
          '/self-hosted',
          '/self-hosted/101',
          '/self-hosted/architecture',
          {
            label: 'Install',
            display: 'group',
            // Pinned open — it's what most visitors came for. The other groups
            // start collapsed (and auto-expand when they contain the current page).
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
      }
    ]
  }
});
