import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/feature/auth/components/auth-provider';
import { request } from '@/feature/common/api/request';
import { useApi } from '@/feature/common/components/api-provider';
import { snapshotQueryOptions } from '@/feature/common/helpers/query-snapshot';
import { enrolledCoursesQueryKey } from '@/feature/course/api/enrolled-courses';
import { exploreCoursesQueryKey } from '@/feature/explore/api/query-keys';
import type { LiveClass } from '@/feature/live-class/types/live-class';
import { useActiveOrgId } from '@/feature/org/helpers/active-org-store';

export const liveClassesQueryKey = (userId: string | null, orgId: string | null) =>
  ['live-classes', 'enrolled', userId, orgId] as const;

export const exploreLiveClassesQueryKey = (userId: string | null, orgId: string | null) =>
  ['live-classes', 'explore', userId, orgId] as const;

/** Upcoming live classes in the learner's courses. */
export function useLiveClassesQuery(enabled = true) {
  const api = useApi();
  const { userId } = useAuth();
  const orgId = useActiveOrgId();

  return useQuery({
    ...snapshotQueryOptions(liveClassesQueryKey(userId, orgId), async () => {
      const response = await request(api.account['live-classes'].$get());

      return response.data;
    }),
    enabled: Boolean(userId && orgId) && enabled,
    refetchInterval: 60 * 1000
  });
}

/** Upcoming live classes in catalog courses the learner is not in. */
export function useExploreLiveClassesQuery(enabled = true) {
  const api = useApi();
  const { userId } = useAuth();
  const orgId = useActiveOrgId();

  return useQuery({
    ...snapshotQueryOptions(exploreLiveClassesQueryKey(userId, orgId), async () => {
      const response = await request(api.account['live-classes'].explore.$get());

      return response.data;
    }),
    enabled: Boolean(userId && orgId) && enabled
  });
}

function withRegistration(list: LiveClass[] | undefined, lessonId: string, isRegistered: boolean) {
  return list?.map((item) =>
    item.lessonId === lessonId
      ? {
          ...item,
          isRegistered,
          registeredCount: Math.max(
            0,
            item.registeredCount + (isRegistered === item.isRegistered ? 0 : isRegistered ? 1 : -1)
          )
        }
      : item
  );
}

/** Registers or unregisters the learner for a live class. Registering from Explore also enrolls them in the course. */
export function useLiveClassRegistrationMutation() {
  const api = useApi();
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const orgId = useActiveOrgId();
  const keys = [liveClassesQueryKey(userId, orgId), exploreLiveClassesQueryKey(userId, orgId)];

  return useMutation({
    mutationFn: async ({ lessonId, register }: { lessonId: string; register: boolean }) => {
      if (register) {
        const response = await request(
          api.account['live-classes'][':lessonId'].registration.$post({ param: { lessonId } })
        );

        return response.data;
      }

      const response = await request(
        api.account['live-classes'][':lessonId'].registration.$delete({ param: { lessonId } })
      );

      return { ...response.data, courseId: null, enrolled: false };
    },
    onMutate: ({ lessonId, register }) => {
      for (const key of keys) {
        queryClient.setQueryData<LiveClass[]>(key, (list) => withRegistration(list, lessonId, register));
      }
    },
    onSettled: (data) =>
      Promise.all([
        ...keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
        ...(data?.enrolled
          ? [
              queryClient.invalidateQueries({ queryKey: enrolledCoursesQueryKey(userId, orgId) }),
              queryClient.invalidateQueries({ queryKey: exploreCoursesQueryKey(userId, orgId) })
            ]
          : [])
      ])
  });
}
