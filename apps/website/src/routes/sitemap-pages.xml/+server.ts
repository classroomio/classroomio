import { buildSitemapXml } from '$lib/server/agent-resources';
import { getChangelog } from '$lib/server/changelog';
import { getSiteCatalog } from '$lib/server/site-pages';

export const prerender = false;

export async function GET({ platform }) {
  const entries = await getChangelog(platform?.env?.USERJOT_API_KEY, platform?.env?.CACHE);
  const { pages, lastModifiedByPath } = getSiteCatalog(entries[0]?.publishedAt.slice(0, 10) ?? null);

  return new Response(buildSitemapXml(pages, lastModifiedByPath), {
    headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=300, s-maxage=900' }
  });
}
