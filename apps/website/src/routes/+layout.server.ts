import { building, dev } from '$app/environment';
import { getGithubStars } from '$lib/server/github-stars';

export async function load({ platform }) {
  // adapter-cloudflare throws on platform.env.* in prerenderable routes, including under vite dev; only runtime SSR reads KV.
  const kv = building || dev ? null : platform?.env?.CACHE;
  const stars = await getGithubStars(kv);

  return { stars };
}
