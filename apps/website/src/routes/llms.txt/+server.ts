import { buildLlmsTxt } from '$lib/server/agent-resources';

export const prerender = false;

export function GET() {
  return new Response(buildLlmsTxt(), {
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=300, s-maxage=3600' }
  });
}
