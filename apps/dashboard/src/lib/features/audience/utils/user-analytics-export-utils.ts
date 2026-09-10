import type { ExportDocument } from '@cio/utils/export';
import type { UserAnalytics, UserCourseWithStats } from '$lib/utils/types/analytics';

type UserAnalyticsExportHeaders = {
  course: string;
  lessonsCompleted: string;
  lessons: string;
  exercisesCompleted: string;
  exercises: string;
  progress: string;
  averageGrade: string;
};

/**
 * One row per enrolled course — the drill-down from a learner flagged in the
 * roster. Headers arrive translated; the caller owns copy.
 */
export function buildUserAnalyticsExportDocument(
  analytics: UserAnalytics,
  headers: UserAnalyticsExportHeaders
): ExportDocument<UserCourseWithStats> {
  const learner = analytics.user?.fullName || analytics.user?.email || 'learner';

  return {
    filename: `${learner}-progress-${new Date().toISOString().slice(0, 10)}`,
    title: learner,
    subtitle: `${headers.progress}: ${analytics.overallCourseProgress ?? 0}% · ${headers.averageGrade}: ${analytics.overallAverageGrade ?? 0}%`,
    columns: [
      { key: 'course', header: headers.course, value: (row) => row.title },
      { key: 'lessonsCompleted', header: headers.lessonsCompleted, value: (row) => row.lessons_completed ?? 0 },
      { key: 'lessons', header: headers.lessons, value: (row) => row.lessons_count ?? 0 },
      { key: 'exercisesCompleted', header: headers.exercisesCompleted, value: (row) => row.exercises_completed ?? 0 },
      { key: 'exercises', header: headers.exercises, value: (row) => row.exercises_count ?? 0 },
      { key: 'progress', header: headers.progress, value: (row) => `${row.progress_percentage ?? 0}%` },
      { key: 'averageGrade', header: headers.averageGrade, value: (row) => `${row.average_grade ?? 0}%` }
    ],
    rows: analytics.courses ?? []
  };
}
