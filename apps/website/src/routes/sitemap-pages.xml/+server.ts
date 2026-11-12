import { buildSitemapXml } from '$lib/server/agent-resources';
import { getPublishedBlogPosts } from '$lib/server/blog';

export const prerender = false;

export function GET() {
  const blogSlugs = getPublishedBlogPosts().map((post) => post.slug);

  return new Response(buildSitemapXml(blogSlugs), {
    headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=300, s-maxage=3600' }
  });
}
