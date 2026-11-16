import type { SitePage } from '$lib/data/site-pages';
import { STATIC_SITE_PAGES } from '$lib/data/site-pages';
import { getAlternative, SLUGS } from '$lib/features/alternatives/content';
import { getPublishedBlogPosts } from './blog';

export type SiteCatalog = {
  pages: SitePage[];
  lastModifiedByPath: Map<string, string>;
};

/**
 * Every public page: the static registry, each alternatives comparison, and each published blog post.
 * @param changelogLastModified ISO date of the newest changelog entry, used as the changelog page's lastmod.
 */
export function getSiteCatalog(changelogLastModified: string | null): SiteCatalog {
  const alternatives = SLUGS.map((slug): SitePage => {
    const { page } = getAlternative(slug)!;

    return { path: `/alternatives/${slug}`, title: page.seo.title, description: page.seo.meta };
  });
  const blogPosts = getPublishedBlogPosts();
  const blogPages = blogPosts.map(
    (post): SitePage => ({ path: `/blog/${post.slug}`, title: post.title, description: post.description })
  );
  const lastModifiedByPath = new Map<string, string>(blogPosts.map((post) => [`/blog/${post.slug}`, post.date]));
  if (changelogLastModified) lastModifiedByPath.set('/changelog', changelogLastModified);

  return { pages: [...STATIC_SITE_PAGES, ...alternatives, ...blogPages], lastModifiedByPath };
}
