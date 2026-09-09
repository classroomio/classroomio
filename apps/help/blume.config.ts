import { defineConfig } from 'blume';
import { z } from 'zod';

/**
 * The site is served at classroomio.com/help, proxied to this worker by the
 * marketing site (apps/website/src/hooks.server.ts). `deployment.base` only
 * rewrites URLs in the emitted HTML — it does not nest the build output, so
 * scripts/package-assets.mjs moves dist/ under help/ to match the served path.
 *
 * `navigation.sidebar` below is explicit, which replaces Blume's generated
 * folder-tree sidebar entirely — per-folder meta.ts files and each page's
 * `sidebar.order` frontmatter no longer drive group label/order or in-group
 * page order; Blume's config-sidebar path (`buildConfigSidebar`) just walks
 * this array verbatim, so order is purely each item's position here.
 *
 * It's two levels deep: top-level `display: 'flat'` sections nest the actual
 * topic groups. The section-header/divider styling lives in the ejected
 * components/blume/NavTree.astro.
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
    // New groups must nest inside one of the three sections below, not sit
    // at the top level — register-sidebar-pages.mjs only recurses into them.
    sidebar: [
      '/',
      {
        label: 'Running your academy',
        display: 'flat',
        items: [
          {
            label: 'Get started',
            display: 'group',
            collapsed: true,
            items: [
              '/get-started',
              '/get-started/signup',
              '/get-started/onboarding',
              '/get-started/create-first-course'
            ]
          },
          {
            label: 'Create & deliver learning',
            display: 'group',
            collapsed: true,
            items: [
              '/create-and-deliver/course-types',
              '/create-and-deliver/create-exercise',
              '/create-and-deliver/grade-exercise',
              '/create-and-deliver/course-progression',
              '/create-and-deliver/certificates',
              '/create-and-deliver/use-math-in-editor',
              '/create-and-deliver/live-class',
              '/create-and-deliver/take-attendance'
            ]
          },
          {
            label: 'Manage students & enrollment',
            display: 'group',
            collapsed: true,
            items: [
              '/manage-students/course-enrollment',
              '/manage-students/welcome-email',
              '/manage-students/invite-students',
              '/manage-students/create-a-cohort',
              '/manage-students/manage-your-audience',
              '/manage-students/enrollment-access-control'
            ]
          },
          {
            label: 'Publish & brand your academy',
            display: 'group',
            collapsed: true,
            items: [
              '/publish-and-brand/course-landingpage',
              '/publish-and-brand/org-landing-page',
              '/publish-and-brand/academy-sharing-and-branding',
              '/publish-and-brand/custom-domain'
            ]
          },
          {
            label: 'Organization & team',
            display: 'group',
            collapsed: true,
            items: [
              '/organization-and-team/admin-dashboard',
              '/organization-and-team/customize-organization',
              '/organization-and-team/invite-team-member',
              '/organization-and-team/roles-and-permissions',
              '/organization-and-team/manage-tags'
            ]
          },
          {
            label: 'Integrations & SSO',
            display: 'group',
            collapsed: true,
            items: ['/integrations', '/integrations/enterprise-sso-setup', '/integrations/use-the-community-forum']
          }
        ]
      },
      {
        label: 'Learning on ClassroomIO',
        display: 'flat',
        items: [
          {
            label: 'Student guides',
            display: 'group',
            collapsed: true,
            items: [
              '/student-guides',
              '/student-guides/join-a-course',
              '/student-guides/navigate-your-dashboard',
              '/student-guides/join-a-live-class',
              '/student-guides/ask-a-question'
            ]
          }
        ]
      },
      {
        label: 'Reference',
        display: 'flat',
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
