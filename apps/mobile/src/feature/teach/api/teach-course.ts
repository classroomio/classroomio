import { useQuery } from '@tanstack/react-query';

import { request } from '@/feature/common/api/request';
import { useApi } from '@/feature/common/components/api-provider';

import { teachKeys, useTeachScope } from './teach-scope';

export const ROSTER_POLL_MS = 5000;

/** The full course with its roster and attendance; `pollMs` refetches on an interval, as while check-in is open. */
export function useTeachCourseQuery(courseId: string, { pollMs }: { pollMs?: number } = {}) {
  const api = useApi();
  const { userId, orgId, enabled } = useTeachScope();

  return useQuery({
    queryKey: teachKeys.course(userId, orgId, courseId),
    queryFn: async () => {
      const response = await request(api.course[':courseId'].$get({ param: { courseId }, query: {} }));

      return response.data;
    },
    enabled: enabled && Boolean(courseId),
    refetchInterval: pollMs ?? false
  });
}

export function useCourseAnalyticsQuery(courseId: string) {
  const api = useApi();
  const { userId, orgId, enabled } = useTeachScope();

  return useQuery({
    queryKey: teachKeys.analytics(userId, orgId, courseId),
    queryFn: async () => {
      const response = await request(api.course[':courseId'].analytics.$get({ param: { courseId } }));

      return response.data;
    },
    enabled: enabled && Boolean(courseId),
    retry: false
  });
}
