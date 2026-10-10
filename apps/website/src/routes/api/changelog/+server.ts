import { json } from '@sveltejs/kit';
import { getChangelog } from '$lib/server/changelog';

export const prerender = false;

export async function GET({ platform, setHeaders, url }) {
  const requestedLimit = Number(url.searchParams.get('limit'));
  const limit = Number.isInteger(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 30) : 30;
  const entries = await getChangelog(platform?.env?.USERJOT_API_KEY, platform?.env?.CACHE);

  setHeaders({ 'cache-control': 'public, max-age=300' });

  return json({ entries: entries.slice(0, limit) });
}
