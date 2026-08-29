import { defineConfig } from 'blume';

/**
 * The site is served at classroomio.com/help, proxied to this worker by the
 * marketing site (apps/website/src/hooks.server.ts). `deployment.base` only
 * rewrites URLs in the emitted HTML — it does not nest the build output, so
 * scripts/package-assets.mjs moves dist/ under help/ to match the served path.
 *
 * No `navigation.sidebar` is declared: the sidebar is generated from the
 * content/help folder tree (one folder per group, each file a page). Group
 * label/order comes from each folder's meta.ts; page order within a group
 * comes from that page's `sidebar.order` frontmatter.
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
    // ClassroomIO's brand blue (Tailwind blue-700, `--color-blue-700` in
    // apps/website/src/app.css and apps/dashboard/src/app.css's default
    // theme) — Blume's default `accent: 'blue'` preset is a generic
    // desaturated blue, not this brand color, which is why the accent
    // button/icons looked off before this was set explicitly.
    accent: '#1d4ed8'
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
  navigation: {
    // Pinned links above the sidebar tree, on every breakpoint — the
    // cross-surface rail (dev docs, source, blog) that sits outside the
    // Help Center's own content.
    featured: [
      { label: 'Help Center', href: '/', icon: 'book-open' },
      { label: 'Developer Docs', href: 'https://classroomio.com/docs', icon: 'terminal' },
      { label: 'GitHub', href: 'https://github.com/classroomio/classroomio', icon: 'github' },
      { label: 'Blog', href: 'https://classroomio.com/blog', icon: 'newspaper' }
    ]
  }
});
