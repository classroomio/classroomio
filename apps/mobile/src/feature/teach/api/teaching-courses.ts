import { useQuery } from '@tanstack/react-query';

import { request } from '@/feature/common/api/request';
import { useApi } from '@/feature/common/components/api-provider';

import { teachKeys, useTeachScope } from './teach-scope';

export function useTeachingCoursesQuery() {
  const api = useApi();
  const { userId, orgId, enabled } = useTeachScope();

  return useQuery({
    queryKey: teachKeys.courses(userId, orgId),
    queryFn: async () => {
      const response = await request(api.account['teaching-courses'].$get());

      return response.data;
    },
    enabled
  });
}
