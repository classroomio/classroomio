import type { ExportDocument } from '@cio/utils/export';
import type { CourseAnalytics, StudentOverview } from '$lib/utils/types/analytics';

type CourseAnalyticsExportHeaders = {
  name: string;
  email: string;
  lessonsCompleted: string;
  lessons: string;
  exercisesSubmitted: string;
  exercises: string;
  progress: string;
  averageGrade: string;
  lastSeen: string;
};

function formatLastSeen(value: string | undefined): string | null {
  if (!value) return null;

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

/**
 * One row per student — "is this cohort using it", the same question as the
 * roster one level down. Headers arrive translated.
 */
export function buildCourseAnalyticsExportDocument(
  analytics: CourseAnalytics,
  courseTitle: string,
  headers: CourseAnalyticsExportHeaders
): ExportDocument<StudentOverview> {
  return {
    filename: `${courseTitle}-analytics-${new Date().toISOString().slice(0, 10)}`,
    title: courseTitle,
    subtitle: `${headers.progress}: ${analytics.lessonCompletionRate ?? 0}% · ${headers.averageGrade}: ${analytics.averageGrade ?? 0}%`,
    columns: [
      { key: 'name', header: headers.name, value: (row) => row.profile?.fullname ?? '' },
      { key: 'email', header: headers.email, value: (row) => row.profile?.email ?? '' },
      { key: 'lessonsCompleted', header: headers.lessonsCompleted, value: (row) => row.lessonsCompleted ?? 0 },
      { key: 'lessons', header: headers.lessons, value: (row) => row.totalLessons ?? 0 },
      { key: 'exercisesSubmitted', header: headers.exercisesSubmitted, value: (row) => row.exercisesSubmitted ?? 0 },
      { key: 'exercises', header: headers.exercises, value: (row) => row.totalExercises ?? 0 },
      { key: 'progress', header: headers.progress, value: (row) => `${row.progressPercentage ?? 0}%` },
      { key: 'averageGrade', header: headers.averageGrade, value: (row) => `${row.averageGrade ?? 0}%` },
      { key: 'lastSeen', header: headers.lastSeen, value: (row) => formatLastSeen(row.lastSeen) }
    ],
    rows: analytics.students ?? []
  };
}
