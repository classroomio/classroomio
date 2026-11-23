import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';

import { request } from '@/feature/common/api/request';
import { useApi } from '@/feature/common/components/api-provider';
import type { LearnerFilter, NudgeResult, TeachingLearner } from '@/feature/staff/types/staff';
import { useTeachScope } from '@/feature/teach/api/teach-scope';

import { staffKeys } from './staff-keys';

const PAGE_SIZE = 20;
const SESSION_LIMIT = 10;

export function useTeachingStatsQuery() {
  const api = useApi();
  const { userId, orgId, enabled } = useTeachScope();

  return useQuery({
    queryKey: staffKeys.stats(userId, orgId),
    queryFn: async () => (await request(api.account['teaching-stats'].$get())).data,
    enabled
  });
}

export function useTeachingSessionsQuery() {
  const api = useApi();
  const { userId, orgId, enabled } = useTeachScope();

  return useQuery({
    queryKey: staffKeys.sessions(userId, orgId),
    queryFn: async () =>
      (await request(api.account['teaching-sessions'].$get({ query: { limit: String(SESSION_LIMIT) } }))).data,
    enabled
  });
}

export function useTeachingActivityQuery({ limit = PAGE_SIZE }: { limit?: number } = {}) {
  const api = useApi();
  const { userId, orgId, enabled } = useTeachScope();

  return useInfiniteQuery({
    queryKey: [...staffKeys.activity(userId, orgId), limit],
    queryFn: async ({ pageParam }) => {
      const query = pageParam ? { limit: String(limit), cursor: pageParam } : { limit: String(limit) };

      return (await request(api.account['teaching-activity'].$get({ query }))).data;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? null,
    enabled
  });
}

export function useUpcomingSubmissionsQuery() {
  const api = useApi();
  const { userId, orgId, enabled } = useTeachScope();

  return useQuery({
    queryKey: staffKeys.upcomingSubmissions(userId, orgId),
    queryFn: async () => (await request(api.account['teaching-submissions'].upcoming.$get())).data,
    enabled
  });
}

export function useSubmissionHistoryQuery({ enabled: active = true }: { enabled?: boolean } = {}) {
  const api = useApi();
  const { userId, orgId, enabled } = useTeachScope();

  return useInfiniteQuery({
    queryKey: staffKeys.submissionHistory(userId, orgId),
    queryFn: async ({ pageParam }) =>
      (
        await request(
          api.account['teaching-submissions'].history.$get({
            query: { page: String(pageParam), limit: String(PAGE_SIZE) }
          })
        )
      ).data,
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages ? lastPage.pagination.page + 1 : undefined,
    enabled: enabled && active
  });
}

export function useTeachingLearnersQuery(filter: LearnerFilter, search: string) {
  const api = useApi();
  const { userId, orgId, enabled } = useTeachScope();

  return useInfiniteQuery({
    queryKey: staffKeys.learners(userId, orgId, filter, search),
    queryFn: async ({ pageParam }) => {
      const base = { filter, page: String(pageParam), limit: String(PAGE_SIZE) };
      const query = search ? { ...base, search } : base;

      return (await request(api.account['teaching-learners'].$get({ query }))).data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages ? lastPage.pagination.page + 1 : undefined,
    enabled
  });
}

type LearnersPage = { items: TeachingLearner[] };

/** Sends a learner a reminder for one course and records the next time a nudge is allowed on every cached list. */
export function useNudgeLearnerMutation() {
  const api = useApi();
  const queryClient = useQueryClient();
  const { userId, orgId } = useTeachScope();

  return useMutation({
    mutationFn: async ({ courseId, profileId }: { courseId: string; profileId: string }) =>
      (await request(api.account['teaching-learners'].nudge.$post({ json: { courseId, profileId } }))).data,
    onSuccess: (result: NudgeResult) => {
      queryClient.setQueriesData<InfiniteData<LearnersPage, number>>(
        { queryKey: staffKeys.learnersAll(userId, orgId) },
        (data) =>
          data && {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              items: page.items.map((learner) =>
                learner.profileId === result.profileId && learner.course.id === result.courseId
                  ? { ...learner, lastNudgedAt: result.nudgedAt, nextNudgeAt: result.nextNudgeAt }
                  : learner
              )
            }))
          }
      );
    }
  });
}
