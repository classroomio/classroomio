import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/feature/auth/components/auth-provider';
import { request } from '@/feature/common/api/request';
import { useApi } from '@/feature/common/components/api-provider';
import { readQuerySnapshot, snapshotQueryOptions, writeQuerySnapshot } from '@/feature/common/helpers/query-snapshot';
import { useActiveOrgId } from '@/feature/org/helpers/active-org-store';
import type { ExploreCoursesPage, ExploreCourseSummary } from '@/feature/explore/types/explore';

import { exploreCourseQueryKey, exploreCoursesQueryKey } from './query-keys';

const PAGE_SIZE = 20;

type ExplorePages = { pages: ExploreCoursesPage[]; pageParams: number[] };

/** The organization's catalogue of courses the learner is not enrolled in, a page at a time. */
export function useExploreCoursesQuery() {
  const api = useApi();
  const { userId } = useAuth();
  const orgId = useActiveOrgId();
  const queryKey = exploreCoursesQueryKey(userId, orgId);

  return useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const response = await request(
        api.organization.courses.recommended.$get({
          query: { limit: String(PAGE_SIZE), page: String(pageParam) }
        })
      );
      const page: ExploreCoursesPage = { data: response.data, pagination: response.pagination };
      if (pageParam === 1) writeQuerySnapshot(queryKey, page);

      return page;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages ? lastPage.pagination.page + 1 : undefined,
    initialData: () => {
      const firstPage = readQuerySnapshot<ExploreCoursesPage>(queryKey);

      return firstPage ? { pages: [firstPage], pageParams: [1] } : undefined;
    },
    initialDataUpdatedAt: 0,
    enabled: Boolean(userId && orgId)
  });
}

/** A course from the loaded catalogue, so its landing can show the title and artwork before the details arrive. */
export function useExploreCourseSummary(courseId: string): ExploreCourseSummary | undefined {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const orgId = useActiveOrgId();
  const pages = queryClient.getQueryData<ExplorePages>(exploreCoursesQueryKey(userId, orgId));

  for (const page of pages?.pages ?? []) {
    const course = page.data.find((candidate) => candidate.id === courseId);
    if (course) return course;
  }

  return undefined;
}

export function useExploreCourseQuery(courseId: string) {
  const api = useApi();
  const { userId } = useAuth();
  const orgId = useActiveOrgId();

  return useQuery({
    ...snapshotQueryOptions(exploreCourseQueryKey(userId, orgId, courseId), async () => {
      const response = await request(api.organization.courses.recommended[':courseId'].$get({ param: { courseId } }));

      return response.data;
    }),
    enabled: Boolean(userId && orgId && courseId)
  });
}
