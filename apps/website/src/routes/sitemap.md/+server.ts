import { buildSitemapMarkdown } from '$lib/server/agent-resources';
import { getSiteCatalog } from '$lib/server/site-pages';

export const prerender = false;

export function GET() {
  const { pages } = getSiteCatalog(null);

  return new Response(buildSitemapMarkdown(pages), {
    headers: { 'content-type': 'text/markdown; charset=utf-8', 'cache-control': 'public, max-age=300, s-maxage=3600' }
  });
}
