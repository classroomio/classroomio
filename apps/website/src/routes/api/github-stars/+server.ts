import { json } from '@sveltejs/kit';
import { getGithubStars } from '$lib/server/github-stars';

export const prerender = false;

export async function GET({ platform, setHeaders }) {
  const stars = await getGithubStars(platform?.env?.CACHE);

  setHeaders({
    'cache-control': 'public, max-age=3600, s-maxage=86400'
  });

  return json({ stars });
}
