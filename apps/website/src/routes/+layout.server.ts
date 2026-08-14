import { building } from '$app/environment';
import { getGithubStars } from '$lib/server/github-stars';

export async function load({ platform }) {
  // adapter-cloudflare throws if platform.env.* is read while prerendering.
  // Prerendered HTML uses a build-time GitHub fetch; runtime SSR + /api/github-stars use KV.
  const kv = building ? null : platform?.env?.CACHE;
  const stars = await getGithubStars(kv);

  return { stars };
}
