import type { BlogPost } from '$lib/utils/types';

/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
  const response = await fetch('api/blog');
  const posts: BlogPost[] = await response.json();
  return { posts };
}
