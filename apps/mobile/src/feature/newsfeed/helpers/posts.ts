import type { NewsfeedPost } from '@/feature/newsfeed/types/newsfeed';

/** Pinned posts first, each group newest first, as the web newsfeed orders them. */
export function orderPosts(posts: NewsfeedPost[]) {
  return [...posts.filter((post) => post.isPinned), ...posts.filter((post) => !post.isPinned)];
}
