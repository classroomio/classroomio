import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { request } from '@/feature/common/api/request';
import { useApi } from '@/feature/common/components/api-provider';
import type { GradingQueueItem, GradingSubmission, SaveGradesInput, TeachingCourse } from '@/feature/teach/types/teach';

import { teachKeys, useTeachScope } from './teach-scope';

function useGradingQueueOptions() {
  const api = useApi();
  const { userId, orgId, enabled } = useTeachScope();

  return {
    queryKey: teachKeys.queue(userId, orgId),
    queryFn: async () => {
      const response = await request(api.account['grading-queue'].$get());

      return response.data;
    },
    enabled
  };
}

export function useGradingQueueQuery() {
  return useQuery(useGradingQueueOptions());
}

const countOf = (queue: GradingQueueItem[]) => queue.length;

/** Submissions waiting for a grade, from the same cache as the queue. Pass `active: false` for non-staff. */
export function useGradingQueueCount(active: boolean) {
  const options = useGradingQueueOptions();

  return useQuery({ ...options, enabled: options.enabled && active, select: countOf });
}

export function useGradingSubmissionQuery(submissionId: string) {
  const api = useApi();
  const { userId, orgId, enabled } = useTeachScope();

  return useQuery({
    queryKey: teachKeys.submission(userId, orgId, submissionId),
    queryFn: async () => {
      const response = await request(api.account['grading-queue'][':submissionId'].$get({ param: { submissionId } }));

      return response.data;
    },
    enabled: enabled && Boolean(submissionId),
    staleTime: 0
  });
}

/** Removes a submission from the cached queue and lowers its course's to-grade count. */
function useForgetQueuedSubmission() {
  const queryClient = useQueryClient();
  const { userId, orgId } = useTeachScope();

  return (submission: Pick<GradingSubmission, 'id' | 'courseId'>) => {
    let removed = false;

    queryClient.setQueryData<GradingQueueItem[]>(teachKeys.queue(userId, orgId), (queue) => {
      if (!queue) return queue;

      removed = queue.some((item) => item.id === submission.id);

      return queue.filter((item) => item.id !== submission.id);
    });

    if (!removed) return;

    queryClient.setQueryData<TeachingCourse[]>(teachKeys.courses(userId, orgId), (courses) =>
      courses?.map((course) =>
        course.id === submission.courseId ? { ...course, toGrade: Math.max(0, course.toGrade - 1) } : course
      )
    );
  };
}

type SaveGradesVariables = {
  submission: Pick<GradingSubmission, 'id' | 'courseId' | 'gradingState'>;
  grades: SaveGradesInput;
};

export function useSaveGradesMutation() {
  const api = useApi();
  const queryClient = useQueryClient();
  const { userId, orgId } = useTeachScope();
  const forget = useForgetQueuedSubmission();

  return useMutation({
    mutationFn: async ({ submission, grades }: SaveGradesVariables) => {
      const route = api.course[':courseId'].submission[':submissionId'];
      const param = { courseId: submission.courseId, submissionId: submission.id };

      // The grading workflow only reaches "completed" from "processing" or "awaiting_manual".
      if (submission.gradingState === 'queued') {
        await request(route.$put({ param, json: { gradingState: 'processing' } }));
      }

      const response = await request(route.grades.$put({ param, json: grades }));

      return response.data;
    },
    onSuccess: (_data, { submission }) => {
      forget(submission);
      queryClient.removeQueries({ queryKey: teachKeys.submission(userId, orgId, submission.id) });
    }
  });
}

export function useDeleteSubmissionMutation() {
  const api = useApi();
  const queryClient = useQueryClient();
  const { userId, orgId } = useTeachScope();
  const forget = useForgetQueuedSubmission();

  return useMutation({
    mutationFn: async (submission: Pick<GradingSubmission, 'id' | 'courseId'>) => {
      const response = await request(
        api.course[':courseId'].submission[':submissionId'].$delete({
          param: { courseId: submission.courseId, submissionId: submission.id }
        })
      );

      return response.data;
    },
    onSuccess: (_data, submission) => {
      forget(submission);
      queryClient.removeQueries({ queryKey: teachKeys.submission(userId, orgId, submission.id) });
    }
  });
}
