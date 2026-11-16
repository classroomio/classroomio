import { buildChangelogFeed } from '$lib/server/agent-resources';
import { getChangelog } from '$lib/server/changelog';

export const prerender = false;

export async function GET({ platform }) {
  const entries = await getChangelog(platform?.env?.USERJOT_API_KEY, platform?.env?.CACHE);

  return new Response(buildChangelogFeed(entries, new Date()), {
    headers: {
      'content-type': 'application/atom+xml; charset=utf-8',
      'cache-control': 'public, max-age=300, s-maxage=300'
    }
  });
}
