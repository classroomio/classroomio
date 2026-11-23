import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { request } from '@/feature/common/api/request';
import { useApi } from '@/feature/common/components/api-provider';
import type { PeopleRoleFilter } from '@/feature/staff/types/staff';
import { useTeachScope } from '@/feature/teach/api/teach-scope';

import { staffKeys } from './staff-keys';

const PAGE_SIZE = 20;

export function useOrgHealthQuery({ enabled: active = true }: { enabled?: boolean } = {}) {
  const api = useApi();
  const { userId, orgId, enabled } = useTeachScope();

  return useQuery({
    queryKey: staffKeys.health(userId, orgId),
    queryFn: async () => (await request(api.organization.insights.health.$get())).data,
    enabled: enabled && active
  });
}

export function useOrgPeopleQuery(role: PeopleRoleFilter, search: string) {
  const api = useApi();
  const { userId, orgId, enabled } = useTeachScope();

  return useInfiniteQuery({
    queryKey: staffKeys.people(userId, orgId, role, search),
    queryFn: async ({ pageParam }) => {
      const base = { role, page: String(pageParam), limit: String(PAGE_SIZE) };
      const query = search ? { ...base, search } : base;

      return (await request(api.organization.insights.people.$get({ query }))).data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages ? lastPage.pagination.page + 1 : undefined,
    enabled
  });
}

export function useStudentCapacityQuery() {
  const api = useApi();
  const { userId, orgId, enabled } = useTeachScope();

  return useQuery({
    queryKey: staffKeys.capacity(userId, orgId),
    queryFn: async () => (await request(api.organization.insights['student-capacity'].$get())).data,
    enabled
  });
}
