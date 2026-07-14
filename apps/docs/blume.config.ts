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
    // Mounted at the path the dashboard and three MDX pages already link to.
    route: '/api/reference',
    // Written by scripts/fetch-openapi.mjs: the R2 spec, enriched with the
    // bearer auth scheme. Not committed.
    spec: './openapi/public-api.json'
  },
  navigation: {
    // Blume's header has no external-links slot, so the links that used to sit
    // in the Fumadocs navbar are pinned above the sidebar instead.
    featured: [
      { label: 'Dashboard', href: 'https://app.classroomio.com/', icon: 'layout-dashboard' },
      { label: 'Demo', href: 'https://dub.sh/ciodemo', icon: 'monitor-play' },
      { label: 'Discord', href: 'https://dub.sh/ciodiscord', icon: 'message-circle' },
      { label: 'Feedback', href: 'https://feedback.classroomio.com', icon: 'megaphone' },
      { label: 'Contact', href: 'https://twitter.com/classroomio', icon: 'at-sign' }
    ],
    // Header tabs. An internal tab scopes the sidebar to the group whose `root`
    // equals its `path`, so each needs a real URL prefix — hence the `root` on
    // the Self Hosting and API groups below. Platform is an absolute URL, so it
    // is left alone by the base-path rewrite and renders as a plain link out to
    // the app.
    tabs: [
      { label: 'Platform', path: 'https://app.classroomio.com/', icon: 'layout-dashboard' },
      { label: 'Guides', path: '/contributor-guides', icon: 'book-open' },
      { label: 'Self Hosting', path: '/self-hosted', icon: 'server' },
      { label: 'API', path: '/api', icon: 'plug' }
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
          '/enterprise-sso'
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
      // The three groups below back the Guides / Self Hosting / API tabs. Their
      // `root` must match the tab `path` exactly, or the tab won't scope to them
      // and its pages stay in the Platform sidebar instead.
      {
        label: 'Contributor guides',
        root: '/contributor-guides',
        items: [
          '/contributor-guides',
          '/contributor-guides/devs',
          '/contributor-guides/design',
          '/contributor-guides/supabase-cloud',
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
          '/self-hosted/docker',
          '/self-hosted/railway',
          '/self-hosted/coolify'
        ]
      },
      {
        label: 'API',
        root: '/api',
        items: [
          '/api',
          // The Scalar reference is its own generated route, not a content page,
          // so it is linked by href rather than resolved from the page index.
          { label: 'API Reference', href: '/api/reference' }
        ]
      }
    ]
  }
});
