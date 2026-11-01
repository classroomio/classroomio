import { useMutation, useQueryClient } from '@tanstack/react-query';

import { request } from '@/feature/common/api/request';
import { useApi } from '@/feature/common/components/api-provider';
import type { AttendanceStatus, TeachCourse, TeachCourseAttendance } from '@/feature/teach/types/teach';

import { teachKeys, useTeachScope } from './teach-scope';

const MAX_RECORDS_PER_REQUEST = 500;

export type AttendanceMark = { studentId: string; status: AttendanceStatus };

type SaveAttendanceVariables = { courseId: string; lessonId: string; records: AttendanceMark[] };

function mergeAttendance(current: TeachCourseAttendance[], saved: TeachCourseAttendance[]) {
  const merged = [...current];
  for (const record of saved) {
    const index = merged.findIndex((item) => item.studentId === record.studentId && item.lessonId === record.lessonId);
    if (index >= 0) merged[index] = { ...merged[index]!, ...record };
    else merged.push(record);
  }

  return merged;
}

/** Saves attendance marks for one lesson through the bulk endpoint and merges the saved rows into the course. */
export function useSaveAttendanceMutation() {
  const api = useApi();
  const queryClient = useQueryClient();
  const { userId, orgId } = useTeachScope();

  return useMutation({
    mutationFn: async ({ courseId, lessonId, records }: SaveAttendanceVariables) => {
      const saved: TeachCourseAttendance[] = [];
      for (let start = 0; start < records.length; start += MAX_RECORDS_PER_REQUEST) {
        const response = await request(
          api.course[':courseId'].attendance.bulk.$put({
            param: { courseId },
            json: { lessonId, records: records.slice(start, start + MAX_RECORDS_PER_REQUEST) }
          })
        );
        saved.push(...response.data);
      }

      return saved;
    },
    onMutate: ({ courseId }) => queryClient.cancelQueries({ queryKey: teachKeys.course(userId, orgId, courseId) }),
    onSuccess: (saved, { courseId }) => {
      queryClient.setQueryData<TeachCourse>(teachKeys.course(userId, orgId, courseId), (course) =>
        course ? { ...course, attendance: mergeAttendance(course.attendance, saved) } : course
      );
    }
  });
}
