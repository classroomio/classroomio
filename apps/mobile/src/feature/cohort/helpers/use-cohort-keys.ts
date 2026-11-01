import { useAuth } from '@/feature/auth/components/auth-provider';
import { useActiveOrgId } from '@/feature/org/helpers/active-org-store';
import {
  cohortCommentsQueryKey,
  cohortCoursesQueryKey,
  cohortMembersQueryKey,
  cohortPeopleCountQueryKey,
  cohortPostsQueryKey,
  cohortQueryKey,
  myCohortGoalsQueryKey
} from '@/feature/cohort/api/query-keys';

export function useCohortKeys(cohortId: string) {
  const { userId } = useAuth();
  const orgId = useActiveOrgId();

  return {
    userId,
    enabled: Boolean(userId && orgId && cohortId),
    cohort: cohortQueryKey(userId, orgId, cohortId),
    courses: cohortCoursesQueryKey(userId, orgId, cohortId),
    peopleCount: cohortPeopleCountQueryKey(userId, orgId, cohortId),
    members: cohortMembersQueryKey(userId, orgId, cohortId),
    myGoals: myCohortGoalsQueryKey(userId, orgId),
    posts: cohortPostsQueryKey(userId, orgId, cohortId),
    comments: (postId: string) => cohortCommentsQueryKey(userId, orgId, cohortId, postId)
  };
}
