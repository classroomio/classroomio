import type { BlogPost } from '$lib/types';

export async function load({ fetch }) {
  const response = await fetch('api/blog');
  const posts: BlogPost[] = await response.json();
  return { posts };
}
