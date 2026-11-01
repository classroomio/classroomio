import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/feature/auth/components/auth-provider';
import { request } from '@/feature/common/api/request';
import { useApi } from '@/feature/common/components/api-provider';
import { snapshotQueryOptions } from '@/feature/common/helpers/query-snapshot';
import { useActiveOrgId } from '@/feature/org/helpers/active-org-store';

export const courseDetailQueryKey = (userId: string | null, orgId: string | null, courseId: string) =>
  ['courses', 'detail', userId, orgId, courseId] as const;

export function useCourseDetailQuery(courseId: string) {
  const api = useApi();
  const { userId } = useAuth();
  const orgId = useActiveOrgId();

  return useQuery({
    ...snapshotQueryOptions(courseDetailQueryKey(userId, orgId, courseId), async () => {
      const response = await request(api.course[':courseId'].$get({ param: { courseId }, query: {} }));

      return response.data;
    }),
    enabled: Boolean(userId && orgId && courseId)
  });
}
