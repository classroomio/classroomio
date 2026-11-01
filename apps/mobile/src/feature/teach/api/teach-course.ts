import { useQuery } from '@tanstack/react-query';

import { request } from '@/feature/common/api/request';
import { useApi } from '@/feature/common/components/api-provider';

import { teachKeys, useTeachScope } from './teach-scope';

export function useTeachCourseQuery(courseId: string) {
  const api = useApi();
  const { userId, orgId, enabled } = useTeachScope();

  return useQuery({
    queryKey: teachKeys.course(userId, orgId, courseId),
    queryFn: async () => {
      const response = await request(api.course[':courseId'].$get({ param: { courseId }, query: {} }));

      return response.data;
    },
    enabled: enabled && Boolean(courseId)
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
