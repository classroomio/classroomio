import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/feature/auth/components/auth-provider';
import { request } from '@/feature/common/api/request';
import { useApi } from '@/feature/common/components/api-provider';
import { enrolledCoursesQueryKey } from '@/feature/course/api/enrolled-courses';
import { homeDigestQueryKey } from '@/feature/course/api/home-digest';
import { useActiveOrgId } from '@/feature/org/helpers/active-org-store';

import { exploreCourseQueryKey, exploreCoursesQueryKey } from './query-keys';

/** Enrols the learner in a free, self-enrolment course, then refreshes their courses and the catalogue. */
export function useEnrollMutation(courseId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const orgId = useActiveOrgId();

  return useMutation({
    mutationFn: async () => {
      const response = await request(api.course[':courseId'].enroll.$post({ param: { courseId }, json: {} }));

      return response.data;
    },
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: enrolledCoursesQueryKey(userId, orgId) }),
        queryClient.invalidateQueries({ queryKey: homeDigestQueryKey(userId, orgId) }),
        queryClient.invalidateQueries({ queryKey: exploreCourseQueryKey(userId, orgId, courseId) }),
        queryClient.invalidateQueries({ queryKey: exploreCoursesQueryKey(userId, orgId) })
      ])
  });
}
