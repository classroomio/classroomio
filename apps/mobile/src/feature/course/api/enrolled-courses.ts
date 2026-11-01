import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/feature/auth/components/auth-provider';
import { request } from '@/feature/common/api/request';
import { useApi } from '@/feature/common/components/api-provider';
import { snapshotQueryOptions } from '@/feature/common/helpers/query-snapshot';
import { useActiveOrgId } from '@/feature/org/helpers/active-org-store';

export const enrolledCoursesQueryKey = (userId: string | null, orgId: string | null) =>
  ['courses', 'enrolled', userId, orgId] as const;

export function useEnrolledCoursesQuery() {
  const api = useApi();
  const { userId } = useAuth();
  const orgId = useActiveOrgId();

  return useQuery({
    ...snapshotQueryOptions(enrolledCoursesQueryKey(userId, orgId), async () => {
      const response = await request(api.organization.courses.enrolled.$get());

      return response.data;
    }),
    enabled: Boolean(userId && orgId)
  });
}
