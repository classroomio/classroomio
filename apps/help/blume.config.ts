import { defineConfig } from 'blume';
import { z } from 'zod';

/**
 * The site is served at classroomio.com/help, proxied to this worker by the
 * marketing site (apps/website/src/hooks.server.ts). `deployment.base` only
 * rewrites URLs in the emitted HTML — it does not nest the build output, so
 * scripts/package-assets.mjs moves dist/ under help/ to match the served path.
 *
 * `navigation.sidebar` below is explicit, which replaces Blume's generated
 * folder-tree sidebar entirely — per-folder meta.ts files no longer drive
 * group label/order. Page order within a group still comes from each page's
 * `sidebar.order` frontmatter.
 */
export default defineConfig({
  title: 'ClassroomIO Help Center',
  description: 'Guides for running your ClassroomIO academy, from signup to publishing.',
  logo: {
    text: 'ClassroomIO',
    image: '/help/logo-192.png',
    href: '/help'
  },
  content: {
    root: 'content/help'
  },
  deployment: {
    output: 'static',
    site: 'https://classroomio.com',
    base: '/help'
  },
  github: {
    owner: 'classroomio',
    repo: 'classroomio',
    dir: 'apps/help'
  },
  theme: {
    mode: 'system',
    accent: '#1d4ed8'
  },
  // `last_reviewed` is the staleness field scripts/check-stale-docs.mjs reads.
  // Blume's page frontmatter schema is strict, so without this it fails the
  // build on any page that sets it.
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
    // Read directly from `public/` by Blume's OG renderer — unlike
    // `logo.image` below, this is NOT rewritten with the `/help` deployment
    // base, so it must be the public-relative path, not the served URL.
    og: {
      logo: '/logo.svg'
    },
    x: {
      creator: '@classroomio',
      handle: '@classroomio'
    }
  },
  navigation: {
    tabs: [
      { label: 'Help Center', path: '/', icon: 'book-open' },
      { label: 'Developers', path: 'https://classroomio.com/docs/developers', icon: 'terminal' },
      { label: 'API', path: 'https://classroomio.com/docs/api', icon: 'code' }
    ],
    sidebar: [
      '/',
      {
        label: 'Get started',
        display: 'group',
        collapsed: false,
        items: ['/get-started', '/get-started/signup', '/get-started/onboarding', '/get-started/create-first-course']
      },
      {
        label: 'Build a course',
        display: 'group',
        collapsed: false,
        items: [
          '/build-a-course/course-types',
          '/build-a-course/create-exercise',
          '/build-a-course/grade-exercise',
          '/build-a-course/course-progression',
          '/build-a-course/certificates',
          '/build-a-course/use-math-in-editor'
        ]
      },
      {
        label: 'Live classes',
        display: 'group',
        collapsed: false,
        items: ['/live-classes/live-class', '/live-classes/take-attendance']
      },
      {
        label: 'Enrollment & students',
        display: 'group',
        collapsed: false,
        items: [
          '/enrollment-and-students/course-enrollment',
          '/enrollment-and-students/welcome-email',
          '/enrollment-and-students/invite-students',
          '/enrollment-and-students/create-a-cohort',
          '/enrollment-and-students/manage-your-audience',
          '/enrollment-and-students/enrollment-access-control'
        ]
      },
      {
        label: 'Publish your academy',
        display: 'group',
        collapsed: false,
        items: [
          '/publish-your-academy/course-landingpage',
          '/publish-your-academy/org-landing-page',
          '/publish-your-academy/academy-sharing-and-branding',
          '/publish-your-academy/custom-domain'
        ]
      },
      {
        label: 'Organization & team',
        display: 'group',
        collapsed: false,
        items: [
          '/organization-and-team/admin-dashboard',
          '/organization-and-team/customize-organization',
          '/organization-and-team/invite-team-member',
          '/organization-and-team/roles-and-permissions',
          '/organization-and-team/enterprise-sso-setup',
          '/organization-and-team/manage-tags',
          '/organization-and-team/use-the-community-forum'
        ]
      },
      {
        label: 'Reference',
        display: 'group',
        collapsed: false,
        items: [
          '/reference',
          '/reference/glossary',
          '/reference/organization',
          '/reference/course',
          '/reference/cohorts',
          '/reference/audience',
          '/reference/student-dashboard',
          '/reference/tags',
          '/reference/community',
          '/reference/enterprise-sso'
        ]
      }
    ]
  }
});
