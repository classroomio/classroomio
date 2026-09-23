import type { ExportDocument } from '@cio/utils/export';
import { ROLE } from '@cio/utils/constants';
import type { PathAnalyticsStudent } from '$features/learning-path/utils/types';
import { getPathMemberDisplayEmail } from '$features/learning-path/utils/path-people-utils';

export type PathAnalyticsExportHeaders = {
  name: string;
  email: string;
  progress: string;
  currentCourse: string;
  enrolled: string;
  status: string;
};

/**
 * One row per learner — the path analogue of the course analytics export
 * document. Matches the overview table (learners only). Headers arrive translated.
 */
export function buildPathAnalyticsExportDocument(
  analytics: { students: PathAnalyticsStudent[]; summary: { completionRate: number; enrolled: number } },
  pathName: string,
  headers: PathAnalyticsExportHeaders
): ExportDocument<PathAnalyticsStudent> {
  const rows = (analytics.students ?? []).filter((student) => Number(student.roleId) === ROLE.STUDENT);

  return {
    filename: `${pathName}-analytics-${new Date().toISOString().slice(0, 10)}`,
    title: pathName,
    subtitle: `${headers.progress}: ${analytics.summary.completionRate ?? 0}%`,
    columns: [
      {
        key: 'name',
        header: headers.name,
        value: (row) => row.fullName ?? getPathMemberDisplayEmail(row) ?? ''
      },
      {
        key: 'email',
        header: headers.email,
        value: (row) => getPathMemberDisplayEmail(row) ?? ''
      },
      {
        key: 'progress',
        header: headers.progress,
        value: (row) => `${row.progressPercent ?? 0}%`
      },
      {
        key: 'currentCourse',
        header: headers.currentCourse,
        value: (row) => row.currentCourseTitle ?? ''
      },
      {
        key: 'enrolled',
        header: headers.enrolled,
        value: (row) => {
          if (!row.enrolledAt) return null;

          const parsed = new Date(row.enrolledAt);
          return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
        }
      },
      { key: 'status', header: headers.status, value: (row) => row.status ?? '' }
    ],
    rows
  };
}
