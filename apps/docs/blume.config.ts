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
      { label: 'Platform', path: '/docs/home', icon: 'layout-dashboard' },
      { label: 'Guides', path: '/contributor-guides', icon: 'book-open' },
      { label: 'Self Hosting', path: '/self-hosted', icon: 'server' }
    ],
    sidebar: [
      {
        label: 'Introduction',
        items: [
          '/home',
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
      },
      {
        label: 'Get started',
        items: ['/create-first-course']
      },
      {
        label: 'Build a course',
        items: [
          '/course-types',
          '/create-exercise',
          '/grade-exercise',
          '/course-progression',
          '/use-math-in-editor',
          '/certificates'
        ]
      },
      {
        label: 'Live classes',
        items: ['/live-class', '/take-attendance']
      },
      {
        label: 'Enrollment & students',
        items: ['/course-enrollment', '/welcome-email', '/invite-students']
      },
      {
        label: 'Publish your academy',
        items: [
          '/course-landingpage',
          '/org-landing-page',
          '/academy-sharing-and-branding',
          '/custom-domain'
        ]
      },
      {
        label: 'Organization & team',
        items: ['/customize-organization', '/invite-team-member', '/roles-and-permissions']
      },
      // The two groups below back the Guides / Self Hosting tabs. Their `root`
      // must match the tab `path` exactly, or the tab won't scope to them and its
      // pages stay in the Platform sidebar instead. (The API tab needs no group:
      // its route is the self-contained Scalar reference, which has its own nav.)
      {
        label: 'Contributor guides',
        root: '/contributor-guides',
        items: [
          '/contributor-guides',
          '/contributor-guides/devs',
          '/contributor-guides/design',
          '/contributor-guides/cloudflare-setup',
          '/contributor-guides/org-site-opengraph-and-favicon',
          '/contributor-guides/gitpod',
          '/contributor-guides/demo-accounts',
          '/contributor-guides/student-dashboard',
          '/contributor-guides/adding-translation-to-code'
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
              '/self-hosted/coolify'
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
