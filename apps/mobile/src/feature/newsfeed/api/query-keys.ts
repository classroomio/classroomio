export const newsfeedPostsQueryKey = (userId: string | null, orgId: string | null, courseId: string) =>
  ['newsfeed', 'posts', userId, orgId, courseId] as const;

export const newsfeedPostQueryKey = (userId: string | null, orgId: string | null, courseId: string, postId: string) =>
  ['newsfeed', 'post', userId, orgId, courseId, postId] as const;

export const newsfeedViewerQueryKey = (userId: string | null, orgId: string | null, courseId: string) =>
  ['newsfeed', 'viewer', userId, orgId, courseId] as const;

export const newsfeedThreadQueryKey = (userId: string | null, orgId: string | null, courseId: string, postId: string) =>
  ['newsfeed', 'thread', userId, orgId, courseId, postId] as const;
