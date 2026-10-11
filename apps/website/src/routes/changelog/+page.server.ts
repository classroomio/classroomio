import { building, dev } from '$app/environment';
import { getChangelog } from '$lib/server/changelog';

export const prerender = false;

export async function load({ platform }) {
  const kv = building || dev ? null : platform?.env?.CACHE;
  const entries = await getChangelog(platform?.env?.USERJOT_API_KEY, kv);

  return { entries };
}
