import { json } from '@sveltejs/kit';
import { getGithubStars } from '$lib/server/github-stars';

// The site is prerendered (`prerender = true` in the root +layout.ts), so a
// build-time fetch bakes the value into static HTML and shows 0 whenever the
// build-time GitHub call fails. Serve the count at runtime instead so it reads
// the KV-backed cache on every request.
export const prerender = false;

export async function GET({ platform }) {
  const kv = platform?.env?.CACHE ?? null;
  const stars = await getGithubStars(kv);

  return json({ stars }, { headers: { 'cache-control': 'public, max-age=3600' } });
}
