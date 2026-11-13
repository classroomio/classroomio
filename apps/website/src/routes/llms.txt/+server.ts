import { buildLlmsTxt } from '$lib/server/agent-resources';
import { getChangelog } from '$lib/server/changelog';
import { loadHelpArticleIndex } from '$lib/server/help-index';
import { getSiteCatalog } from '$lib/server/site-pages';

export const prerender = false;

export async function GET({ platform }) {
  const [entries, helpIndex] = await Promise.all([
    getChangelog(platform?.env?.USERJOT_API_KEY, platform?.env?.CACHE),
    loadHelpArticleIndex()
  ]);
  const { pages } = getSiteCatalog(entries[0]?.publishedAt.slice(0, 10) ?? null);

  return new Response(buildLlmsTxt({ entries, helpIndex, pages }), {
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=300, s-maxage=900' }
  });
}
