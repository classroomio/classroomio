import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { request } from '@/feature/common/api/request';
import { useApi } from '@/feature/common/components/api-provider';
import type { CheckInCode } from '@/feature/teach/types/teach';

import { teachKeys, useTeachScope } from './teach-scope';

/** The lesson's active check-in code, or null when check-in is not open. */
export function useCheckInCodeQuery(courseId: string, lessonId: string | null) {
  const api = useApi();
  const { userId, orgId, enabled } = useTeachScope();

  return useQuery({
    queryKey: teachKeys.checkInCode(userId, orgId, courseId, lessonId ?? ''),
    queryFn: async (): Promise<CheckInCode | null> => {
      const response = await request(
        api.course[':courseId'].attendance[':lessonId']['check-in-code'].$get({
          param: { courseId, lessonId: lessonId! }
        })
      );

      return response.data;
    },
    enabled: enabled && Boolean(courseId && lessonId),
    staleTime: 0
  });
}

/** Issues a new code for the lesson, replacing the current one. */
export function useStartCheckInMutation(courseId: string, lessonId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  const { userId, orgId } = useTeachScope();

  return useMutation({
    mutationFn: async () => {
      const response = await request(
        api.course[':courseId'].attendance[':lessonId']['check-in-code'].$post({ param: { courseId, lessonId } })
      );

      return response.data;
    },
    onSuccess: (code) => queryClient.setQueryData(teachKeys.checkInCode(userId, orgId, courseId, lessonId), code)
  });
}

export function useEndCheckInMutation(courseId: string, lessonId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  const { userId, orgId } = useTeachScope();

  return useMutation({
    mutationFn: async () => {
      const response = await request(
        api.course[':courseId'].attendance[':lessonId']['check-in-code'].$delete({ param: { courseId, lessonId } })
      );

      return response.data;
    },
    onSuccess: () => queryClient.setQueryData(teachKeys.checkInCode(userId, orgId, courseId, lessonId), null)
  });
}
