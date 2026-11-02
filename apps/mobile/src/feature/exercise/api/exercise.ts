import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/feature/auth/components/auth-provider';
import { request } from '@/feature/common/api/request';
import { useApi } from '@/feature/common/components/api-provider';
import type { SubmissionAnswerInput } from '@/feature/exercise/types/exercise';
import { useActiveOrgId } from '@/feature/org/helpers/active-org-store';

export const exerciseQueryKey = (userId: string | null, orgId: string | null, courseId: string, exerciseId: string) =>
  ['exercise', 'detail', userId, orgId, courseId, exerciseId] as const;

export const exerciseAttemptsQueryKey = (
  userId: string | null,
  orgId: string | null,
  courseId: string,
  exerciseId: string
) => ['exercise', 'attempts', userId, orgId, courseId, exerciseId] as const;

export function useExerciseQuery(courseId: string, exerciseId: string) {
  const api = useApi();
  const { userId } = useAuth();
  const orgId = useActiveOrgId();

  return useQuery({
    queryKey: exerciseQueryKey(userId, orgId, courseId, exerciseId),
    queryFn: async () => {
      const response = await request(
        api.course[':courseId'].exercise[':exerciseId'].$get({ param: { courseId, exerciseId } })
      );

      return response.data;
    },
    enabled: Boolean(userId && orgId && courseId && exerciseId)
  });
}

export function useExerciseAttemptsQuery(courseId: string, exerciseId: string) {
  const api = useApi();
  const { userId } = useAuth();
  const orgId = useActiveOrgId();

  return useQuery({
    queryKey: exerciseAttemptsQueryKey(userId, orgId, courseId, exerciseId),
    queryFn: async () => {
      const response = await request(
        api.course[':courseId'].exercise[':exerciseId'].attempts.$get({ param: { courseId, exerciseId } })
      );

      return response.data;
    },
    enabled: Boolean(userId && orgId && courseId && exerciseId)
  });
}

export function useSubmitExerciseMutation(courseId: string, exerciseId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const orgId = useActiveOrgId();

  return useMutation({
    mutationFn: async (answers: SubmissionAnswerInput[]) => {
      const response = await request(
        api.course[':courseId'].exercise[':exerciseId'].submission.$post({
          param: { courseId, exerciseId },
          json: { exerciseId, answers }
        })
      );

      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: exerciseAttemptsQueryKey(userId, orgId, courseId, exerciseId) });
      void queryClient.invalidateQueries({ queryKey: exerciseQueryKey(userId, orgId, courseId, exerciseId) });
      void queryClient.invalidateQueries({ queryKey: ['courses'] });
      void queryClient.invalidateQueries({ queryKey: ['course'] });
    }
  });
}
