import { useMutation, useQueryClient } from '@tanstack/react-query';

import { request } from '@/feature/common/api/request';
import { useApi } from '@/feature/common/components/api-provider';
import type { TeachCourse } from '@/feature/teach/types/teach';

import { teachKeys, useTeachScope } from './teach-scope';

type SaveAttendanceVariables = {
  courseId: string;
  lessonId: string;
  /** Group member id to presence; only changed learners need to be sent. */
  changes: Array<{ studentId: string; isPresent: boolean }>;
};

export function useSaveAttendanceMutation() {
  const api = useApi();
  const queryClient = useQueryClient();
  const { userId, orgId } = useTeachScope();

  return useMutation({
    mutationFn: async ({ courseId, lessonId, changes }: SaveAttendanceVariables) => {
      const results = await Promise.allSettled(
        changes.map((change) =>
          request(
            api.course[':courseId'].attendance.$post({
              param: { courseId },
              json: { courseId, lessonId, studentId: change.studentId, isPresent: change.isPresent }
            })
          )
        )
      );

      const saved = results.flatMap((result) => (result.status === 'fulfilled' ? [result.value.data] : []));
      const failed = results.find((result): result is PromiseRejectedResult => result.status === 'rejected');

      return { saved, failedCount: results.length - saved.length, firstError: failed?.reason as unknown };
    },
    onSuccess: ({ saved }, { courseId }) => {
      queryClient.setQueryData<TeachCourse>(teachKeys.course(userId, orgId, courseId), (course) => {
        if (!course) return course;

        const attendance = [...course.attendance];
        for (const record of saved) {
          const index = attendance.findIndex(
            (item) => item.studentId === record.studentId && item.lessonId === record.lessonId
          );
          if (index >= 0) attendance[index] = { ...attendance[index]!, ...record };
          else attendance.push(record);
        }

        return { ...course, attendance };
      });
    }
  });
}
