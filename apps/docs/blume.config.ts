import { defineConfig } from 'blume';

/**
 * The site is served at classroomio.com/docs, proxied to this worker by the
 * marketing site (apps/website/src/hooks.server.ts). `deployment.base` only
 * rewrites URLs in the emitted HTML — it does not nest the build output, so
 * scripts/package-assets.mjs moves dist/ under docs/ to match the served path.
 *
 * Redirects are NOT declared here: under a base, Astro prefixes a redirect's
 * source but not its target, so it would emit `url=/guides` instead of
 * `/docs/guides`. They live in scripts/package-assets.mjs as a `_redirects` file.
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
      { label: 'Guides', path: '/guides', icon: 'book-open' },
      { label: 'Self Hosting', path: '/self-hosted', icon: 'server' },
      { label: 'API', path: '/api', icon: 'code' }
    ],
    sidebar: [
      {
        label: 'Platform',
        items: [
          '/',
          {
            label: 'Introduction',
            items: [
              '/what-is-classroomio',
              '/terminology',
              {
                label: 'Quickstart',
                items: ['/quickstart/signup', '/quickstart/onboarding']
              }
            ]
          },
          {
            label: 'Core Features',
            items: [
              '/course',
              '/cohorts',
              '/mcp',
              '/tags',
              '/audience',
              '/community',
              '/organization',
              '/student-dashboard',
              '/enterprise-sso',
              '/token-auth'
            ]
          }
        ]
      },
      {
        label: 'Guides',
        root: '/guides',
        items: [
          '/guides',
          {
            label: '',  // User Guides
            items: [
              {
                label: 'Get started',
                items: ['/guides/create-first-course']
              },
              {
                label: 'Build a course',
                items: [
                  '/guides/course-types',
                  '/guides/create-exercise',
                  '/guides/grade-exercise',
                  '/guides/course-progression',
                  '/guides/use-math-in-editor',
                  '/guides/certificates'
                ]
              },
              {
                label: 'Live classes',
                items: ['/guides/live-class', '/guides/take-attendance']
              },
              {
                label: 'Enrollment & students',
                items: [
                  '/guides/course-enrollment',
                  '/guides/welcome-email',
                  '/guides/invite-students'
                ]
              },
              {
                label: 'Publish your academy',
                items: [
                  '/guides/course-landingpage',
                  '/guides/org-landing-page',
                  '/guides/academy-sharing-and-branding',
                  '/guides/custom-domain'
                ]
              },
              {
                label: 'Organization & team',
                items: [
                  '/guides/customize-organization',
                  '/guides/invite-team-member',
                  '/guides/roles-and-permissions'
                ]
              }
            ]
          },
          {
            label: 'Developer Guides',
            items: [
              '/guides/contributing',
              '/guides/contributing/devs',
              '/guides/contributing/design',
              '/guides/contributing/cloudflare-setup',
              '/guides/contributing/org-site-opengraph-and-favicon',
              '/guides/contributing/gitpod',
              '/guides/contributing/demo-accounts',
              '/guides/contributing/student-dashboard',
              '/guides/contributing/adding-translation-to-code'
            ]
          }
        ]
      },
      {
        label: 'Self Hosting',
        root: '/self-hosted',
        items: [
          '/self-hosted',
           {
            label: 'Platforms',
            items: [
              '/self-hosted/docker',
              '/self-hosted/digitalocean',
              '/self-hosted/railway',
              '/self-hosted/coolify',
              '/self-hosted/dokploy'
            ]
          },
          {
            label: 'Configuration',
            items: [
              '/self-hosted/configuration',
              '/self-hosted/configuration/secrets',
              '/self-hosted/configuration/email',
              '/self-hosted/configuration/storage',
              '/self-hosted/configuration/csp',
              '/self-hosted/configuration/integrations',
              '/self-hosted/configuration/sso',
              '/self-hosted/configuration/versions'
            ]
          },
        ]
      }
    ]
  }
});
