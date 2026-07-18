import { getGithubStars } from '$lib/server/github-stars';

export async function load() {
  const stars = await getGithubStars();

  return { stars };
}
