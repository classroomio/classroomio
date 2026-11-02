import { useAuth } from '@/feature/auth/components/auth-provider';
import { useActiveOrgId } from '@/feature/org/helpers/active-org-store';
import {
  newsfeedPostQueryKey,
  newsfeedPostsQueryKey,
  newsfeedThreadQueryKey,
  newsfeedViewerQueryKey
} from '@/feature/newsfeed/api/query-keys';

export function useNewsfeedKeys(courseId: string) {
  const { userId } = useAuth();
  const orgId = useActiveOrgId();

  return {
    enabled: Boolean(userId && orgId && courseId),
    posts: newsfeedPostsQueryKey(userId, orgId, courseId),
    post: (postId: string) => newsfeedPostQueryKey(userId, orgId, courseId, postId),
    viewer: newsfeedViewerQueryKey(userId, orgId, courseId),
    thread: (postId: string) => newsfeedThreadQueryKey(userId, orgId, courseId, postId)
  };
}
