import { json } from '@sveltejs/kit';
import { getPublishedBlogPosts } from '$lib/server/blog';

export function GET() {
  return json(getPublishedBlogPosts());
}
