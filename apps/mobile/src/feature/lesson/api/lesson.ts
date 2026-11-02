import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/feature/auth/components/auth-provider';
import { ApiError, request } from '@/feature/common/api/request';
import { useApi } from '@/feature/common/components/api-provider';
import { snapshotQueryOptions } from '@/feature/common/helpers/query-snapshot';
import { useActiveOrgId } from '@/feature/org/helpers/active-org-store';

export const lessonQueryKey = (userId: string | null, orgId: string | null, courseId: string, lessonId: string) =>
  ['lessons', 'detail', userId, orgId, courseId, lessonId] as const;

export function useLessonQuery(courseId: string, lessonId: string) {
  const api = useApi();
  const { userId } = useAuth();
  const orgId = useActiveOrgId();

  return useQuery({
    ...snapshotQueryOptions(lessonQueryKey(userId, orgId, courseId, lessonId), async () => {
      const response = await request(
        api.course[':courseId'].lesson[':lessonId'].$get({ param: { courseId, lessonId } })
      );

      return response.data;
    }),
    enabled: Boolean(userId && orgId && courseId && lessonId),
    retry: (failureCount, error) => !(error instanceof ApiError && error.status < 500) && failureCount < 1
  });
}

/** Refetches everything a completion changes: course outlines, the enrolled list with its progress, and lessons. */
export function useInvalidateProgress() {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['courses'] }),
      queryClient.invalidateQueries({ queryKey: ['lessons'] })
    ]);
}

export function useCompleteLessonMutation(courseId: string, lessonId: string) {
  const api = useApi();
  const invalidate = useInvalidateProgress();

  return useMutation({
    mutationFn: async (isComplete: boolean) => {
      const response = await request(
        api.course[':courseId'].lesson[':lessonId'].completion.$put({
          param: { courseId, lessonId },
          json: { isComplete }
        })
      );

      return response.data;
    },
    onSuccess: () => invalidate()
  });
}

type WatchBeat = { assetId: string; positionSeconds: number; playedDeltaSeconds: number; durationSeconds: number };

export function useReportWatchProgress(courseId: string, lessonId: string) {
  const api = useApi();

  return async (beat: WatchBeat) => {
    const response = await request(
      api.course[':courseId'].lesson[':lessonId']['watch-progress'].$put({
        param: { courseId, lessonId },
        json: {
          assetId: beat.assetId,
          positionSeconds: Math.max(0, Math.floor(beat.positionSeconds)),
          playedDeltaSeconds: Math.min(120, Math.max(0, Math.round(beat.playedDeltaSeconds))),
          durationSeconds: Math.max(1, Math.round(beat.durationSeconds))
        }
      })
    );

    return response.data;
  };
}
