import { buildSitemapXml } from '$lib/server/agent-resources';
import { getPublishedBlogPosts } from '$lib/server/blog';
import { getChangelog } from '$lib/server/changelog';

export const prerender = false;

export async function GET({ platform }) {
  const blogPosts = getPublishedBlogPosts().map((post) => ({ slug: post.slug, date: post.date }));
  const entries = await getChangelog(platform?.env?.USERJOT_API_KEY, platform?.env?.CACHE);
  const changelogLastModified = entries[0]?.publishedAt.slice(0, 10) ?? null;

  return new Response(buildSitemapXml(blogPosts, changelogLastModified), {
    headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=300, s-maxage=900' }
  });
}
