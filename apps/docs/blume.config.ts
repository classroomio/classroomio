import { readFileSync } from 'node:fs';
import { defineConfig } from 'blume';
import { extractOperations, type ApiDocument } from 'blume/openapi/model.ts';
import { z } from 'zod';

// Hand-written guides (content/docs/api) live at /api; the generated
// reference mounts below them, since Blume always appends the full endpoint
// index to its overview page.
const API_ROUTE = '/api';
const API_REFERENCE_ROUTE = '/api/reference';
const apiSpec = JSON.parse(readFileSync(new URL('./openapi/public-api.json', import.meta.url), 'utf-8')) as ApiDocument;
const { operations: apiOperations, tags: apiTags } = extractOperations(apiSpec, API_REFERENCE_ROUTE);

interface TagPlacement {
  tag: string;
  label?: string;
  flat?: boolean;
  trailingRouteSubstrings?: string[];
}

const API_SECTIONS: Array<{ label: string; tags: TagPlacement[] }> = [
  {
    label: 'Organization',
    tags: [
      { tag: 'Audience' },
      { tag: 'Team' },
      { tag: 'Organization Email Templates', label: 'Email Templates' },
      { tag: 'Organization Landing Page', label: 'Landing Page' }
    ]
  },
  {
    label: 'Courses',
    tags: [
      { tag: 'Courses', label: 'Overview' },
      { tag: 'Course Structure', label: 'Structure' },
      { tag: 'Course Sections', label: 'Sections' },
      { tag: 'Course Lessons', label: 'Lessons' },
      { tag: 'Lesson Translations', label: 'Translations' },
      { tag: 'Lesson Comments', label: 'Comments' },
      { tag: 'Course Content', label: 'Content' },
      { tag: 'Course Members', label: 'Members' },
      { tag: 'Course Invites', label: 'Invites' },
      { tag: 'Course Exercises', label: 'Exercises' },
      { tag: 'Exercise Questions', label: 'Questions' },
      { tag: 'Exercise Sections', label: 'Exercise Sections' },
      { tag: 'Exercise Templates', label: 'Templates' },
      { tag: 'Course Submissions', label: 'Submissions' },
      { tag: 'Course Certificates', label: 'Certificates' },
      { tag: 'Course Templates', label: 'Course Templates' }
    ]
  },
  {
    label: 'Cohorts',
    tags: [
      { tag: 'Cohorts', label: 'Overview', trailingRouteSubstrings: ['cohorts-enrolled'] },
      { tag: 'Cohort Members', label: 'Members' },
      { tag: 'Cohort Courses', label: 'Courses' },
      { tag: 'Cohort Invites', label: 'Invites' },
      { tag: 'Cohort Goals', label: 'Goals' },
      { tag: 'Cohort Newsfeed', label: 'Newsfeed' },
      { tag: 'Cohort Newsfeed Comments', label: 'Comments' }
    ]
  },
  { label: 'Analytics', tags: [{ tag: 'Analytics', flat: true }] },
  { label: 'Media', tags: [{ tag: 'Public API Assets', flat: true }] }
];

const operationsOfTag = (tagName: string): string[] => {
  const tag = apiTags.find((candidate) => candidate.name === tagName);
  if (!tag) {
    return [];
  }

  return Object.values(apiOperations)
    .filter((operation) => operation.tagSlug === tag.slug)
    .map((operation) => operation.route);
};

const routesOfPlacement = (placement: TagPlacement): string[] => {
  const routes = operationsOfTag(placement.tag);
  if (!placement.trailingRouteSubstrings) {
    return routes;
  }

  const [trailingRoutes, mainRoutes] = routes.reduce(
    ([trailingRoutes, mainRoutes], route) => {
      const isTrailing = placement.trailingRouteSubstrings?.some((substring) => route.includes(substring));

      return isTrailing
        ? [[...trailingRoutes, route], mainRoutes]
        : [trailingRoutes, [...mainRoutes, route]];
    },
    [[], []] as [string[], string[]]
  );

  return [...mainRoutes, ...trailingRoutes];
};

const tagGroup = (placement: TagPlacement) => {
  const routes = routesOfPlacement(placement);

  return {
    label: placement.label ?? placement.tag,
    display: 'group' as const,
    collapsed: true,
    items: routes
  };
};

const sectionItem = (placement: TagPlacement) => {
  if (!placement.flat) {
    return [tagGroup(placement)];
  }

  return routesOfPlacement(placement);
};

const placedTags = new Set(API_SECTIONS.flatMap((section) => section.tags.map((placement) => placement.tag)));
const unplacedTags = apiTags.filter((tag) => !placedTags.has(tag.name));
if (unplacedTags.length > 0) {
  console.warn(
    `[docs] API tags missing from API_SECTIONS in blume.config.ts: ${unplacedTags.map((tag) => tag.name).join(', ')}`
  );
}

// Render unplaced tags as standalone groups instead of dropping their
// operations: a stale reused spec (fetch-openapi.mjs falls back to the last
// fetched copy) can still carry tags this config no longer places, and the
// docs build must not silently lose those pages from the sidebar.
const apiSidebarSections = API_SECTIONS.map((section) => ({
  label: section.label,
  display: 'flat' as const,
  items: section.tags.flatMap(sectionItem)
}))
  .filter((section) => section.items.length > 0)
  .concat(unplacedTags.map((tag) => tagGroup({ tag: tag.name })));

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
  redirects: [
    { from: '/', to: '/developers', status: 301 },
    { from: '/developers/mcp/tools', to: '/developers/mcp/access-and-limits', status: 301 }
  ],
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
    // Read directly from `public/` by Blume's OG renderer — unlike
    // `logo.image` below, this is NOT rewritten with the `/docs` deployment
    // base, so it must be the public-relative path, not the served URL.
    og: {
      logo: '/logo.svg'
    },
    x: {
      creator: '@classroomio',
      handle: '@classroomio'
    }
  },
  openapi: {
    enabled: true,
    route: API_REFERENCE_ROUTE,
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
      { label: 'API', path: API_ROUTE, icon: 'code' }
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
        items: [
          {
            label: 'MCP',
            display: 'group',
            collapsed: false,
            items: [
              '/developers/mcp',
              '/developers/mcp/setup',
              '/developers/mcp/access-and-limits',
              '/developers/mcp/course-editing'
            ]
          },
          '/developers/webhooks',
          '/developers/token-auth'
        ]
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
            items: ['/self-hosted/configuration/versions', '/self-hosted/backups', '/self-hosted/migrating-from-minio']
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
      },
      {
        label: 'API',
        root: API_ROUTE,
        items: [
          {
            label: 'Getting started',
            display: 'flat',
            items: [API_ROUTE, '/api/authentication', '/api/rate-limits', '/api/errors', '/api/pagination']
          },
          { label: 'Reference', display: 'flat', items: [API_REFERENCE_ROUTE] },
          ...apiSidebarSections
        ]
      }
    ]
  }
});
