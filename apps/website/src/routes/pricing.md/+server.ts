import { buildPricingMarkdown } from '$lib/server/agent-resources';

export const prerender = false;

export function GET() {
  return new Response(buildPricingMarkdown(), {
    headers: { 'content-type': 'text/markdown; charset=utf-8', 'cache-control': 'public, max-age=300, s-maxage=3600' }
  });
}
