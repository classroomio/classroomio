import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/feature/auth/components/auth-provider';
import { request } from '@/feature/common/api/request';
import { useApi } from '@/feature/common/components/api-provider';
import { snapshotQueryOptions } from '@/feature/common/helpers/query-snapshot';
import { enrolledCoursesQueryKey } from '@/feature/course/api/enrolled-courses';
import { useActiveOrgId } from '@/feature/org/helpers/active-org-store';

export const enrolledPathsQueryKey = (userId: string | null, orgId: string | null) =>
  ['learning-paths', 'enrolled', userId, orgId] as const;

export const explorePathsQueryKey = (userId: string | null, orgId: string | null) =>
  ['learning-paths', 'explore', userId, orgId] as const;

export const learnerPathQueryKey = (userId: string | null, orgId: string | null, pathId: string) =>
  ['learning-paths', 'detail', userId, orgId, pathId] as const;

/** Learning paths the learner is in, with progress and which courses are unlocked. */
export function useEnrolledPathsQuery(enabled = true) {
  const api = useApi();
  const { userId } = useAuth();
  const orgId = useActiveOrgId();

  return useQuery({
    ...snapshotQueryOptions(enrolledPathsQueryKey(userId, orgId), async () => {
      const response = await request(api['learning-path'].enrolled.$get());

      return response.data;
    }),
    enabled: Boolean(userId && orgId) && enabled
  });
}

/** Published learning paths the learner can join and is not in yet. */
export function useExplorePathsQuery(enabled = true) {
  const api = useApi();
  const { userId } = useAuth();
  const orgId = useActiveOrgId();

  return useQuery({
    ...snapshotQueryOptions(explorePathsQueryKey(userId, orgId), async () => {
      const response = await request(api['learning-path'].explore.$get());

      return response.data;
    }),
    enabled: Boolean(userId && orgId) && enabled
  });
}

export function useLearnerPathQuery(pathId: string) {
  const api = useApi();
  const { userId } = useAuth();
  const orgId = useActiveOrgId();

  return useQuery({
    ...snapshotQueryOptions(learnerPathQueryKey(userId, orgId, pathId), async () => {
      const response = await request(api['learning-path'][':pathId'].learner.$get({ param: { pathId } }));

      return response.data;
    }),
    enabled: Boolean(userId && orgId && pathId)
  });
}

/** Joins a free learning path, which enrolls the learner in every course in it. */
export function useEnrollPathMutation(pathId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const orgId = useActiveOrgId();

  return useMutation({
    mutationFn: async () => {
      const response = await request(api['learning-path'][':pathId'].enroll.$post({ param: { pathId } }));

      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(learnerPathQueryKey(userId, orgId, pathId), data);

      return Promise.all([
        queryClient.invalidateQueries({ queryKey: enrolledPathsQueryKey(userId, orgId) }),
        queryClient.invalidateQueries({ queryKey: explorePathsQueryKey(userId, orgId) }),
        queryClient.invalidateQueries({ queryKey: enrolledCoursesQueryKey(userId, orgId) })
      ]);
    }
  });
}
