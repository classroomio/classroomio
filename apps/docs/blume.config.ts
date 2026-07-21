import { defineConfig } from 'blume';

/**
 * The site is served at classroomio.com/docs, proxied to this worker by the
 * marketing site (apps/website/src/hooks.server.ts). `deployment.base` only
 * rewrites URLs in the emitted HTML — it does not nest the build output, so
 * scripts/package-assets.mjs moves dist/ under docs/ to match the served path.
 *
 * Redirects are NOT declared here: under a base, Astro prefixes a redirect's
 * source but not its target, so it would emit `url=/home` instead of
 * `/docs/home`. They live in scripts/package-assets.mjs as a `_redirects` file.
 */
export default defineConfig({
  title: 'ClassroomIO Docs | Customer, Partner, and Employee Education',
  description:
    'Learn how to create customer academies, partner certification programs, and employee training workflows in ClassroomIO.',
  logo: {
    text: 'ClassroomIO',
    image: '/docs/logo-192.png',
    href: '/docs/home'
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
    // The reference IS the API tab. It mounts at /api, and Blume auto-appends a
    // header tab labeled by `sources[].label` ("API") pointing here — so there is
    // no separate hand-written API page or "API Reference" entry anymore. The old
    // /api/reference path 301s here (scripts/package-assets.mjs).
    route: '/api',
    // Written by scripts/fetch-openapi.mjs: the R2 spec, enriched with the
    // bearer auth scheme. Not committed.
    sources: [{ label: 'API', spec: './openapi/public-api.json' }]
  },
  navigation: {
      tabs: [
      // Tab `path` values are base-RELATIVE (no `/docs` prefix): active-tab
      // matching runs in base-less route space, and `deployment.base` is only
      // applied to the emitted href. A `/docs/...` path here never highlights.
      { label: 'Home', path: '/home', icon: 'house' },
      { label: 'Guides', path: '/guides', icon: 'book-open' },
      { label: 'Self Hosting', path: '/self-hosted', icon: 'server' }
    ],
    sidebar: [
      // Ungrouped (no `root`) — the catch-all sidebar, which backs the Home tab.
      {
        label: 'Home',
        items: ['/home']
      },
      // The two groups below back the Guides / Self Hosting tabs. Their `root`
      // must match the tab `path` exactly, or the tab won't scope to them and its
      // pages stay in the catch-all sidebar instead. This is also why every page
      // in a group lives under that group's route prefix. (The API tab needs no
      // group: its route is the self-contained Scalar reference, with its own nav.)
      {
        label: 'Guides',
        root: '/guides',
        items: [
          '/guides',
          {
            label: '',  // User Guides
            items: [
              {
                label: 'Introduction',
                items: [
                  '/guides/what-is-classroomio',
                  '/guides/terminology',
                  {
                    label: 'Quickstart',
                    items: ['/guides/quickstart/signup', '/guides/quickstart/onboarding']
                  }
                ]
              },
              {
                label: 'Core Features',
                items: [
                  '/guides/course',
                  '/guides/cohorts',
                  '/guides/mcp',
                  '/guides/tags',
                  '/guides/audience',
                  '/guides/community',
                  '/guides/organization',
                  '/guides/student-dashboard',
                  '/guides/enterprise-sso',
                  '/guides/token-auth'
                ]
              },
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
