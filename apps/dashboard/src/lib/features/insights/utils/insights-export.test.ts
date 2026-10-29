import { describe, expect, it } from 'vitest';

import { buildStudentsExportDocument } from './insights-export';
import type { InsightsRow, InsightsStructureItem, StudentExportHeaders } from './types';

const headers: StudentExportHeaders = {
  name: 'Name',
  email: 'Email',
  progress: 'Progress',
  nowAt: 'Now at',
  finished: 'Finished',
  averageScore: 'Average score',
  coursesCompleted: 'Courses completed',
  video: 'Video',
  classroom: 'Classroom',
  certificates: 'Certificates',
  lastLogin: 'Last login',
  status: 'Status',
  statusLabels: {
    at_risk: 'At risk',
    lagging: 'Lagging',
    on_track: 'On track',
    completed: 'Completed'
  }
};

const exercises = [
  { id: 'exercise-1', title: 'Exercise one' },
  { id: 'exercise-2', title: 'Exercise two' }
] as InsightsStructureItem[];

const row = {
  name__value: 'Jane Doe',
  email__value: 'jane@example.com',
  overall_progress_pct__value: 72.4,
  now_at_title__value: 'Section one',
  avg_score_pct__value: 81.6,
  courses_completed__value: 2,
  video_pct__value: 50.5,
  attendance_pct__value: 90,
  certificates__value: 1,
  last_login_at__value: '2026-10-01T00:00:00.000Z',
  status__value: 'at_risk'
} as InsightsRow;

function document(courseSelected = false) {
  return buildStudentsExportDocument({
    filename: 'Cohort students',
    title: 'Cohort',
    headers,
    exercises,
    courseSelected,
    rows: [
      {
        row,
        cells: {
          'exercise-1': { scorePct: 66.6, state: 'graded', passed: true },
          'exercise-2': { scorePct: null, state: 'not_taken', passed: null }
        }
      }
    ]
  });
}

describe('buildStudentsExportDocument', () => {
  it('uses the all-courses columns when no course is selected', () => {
    const exportDocument = document();

    expect(exportDocument.rows).toHaveLength(1);
    expect(exportDocument.columns.map((column) => column.header)).toEqual([
      'Name',
      'Email',
      'Progress',
      'Average score',
      'Courses completed',
      'Video',
      'Classroom',
      'Certificates',
      'Last login',
      'Status'
    ]);
  });

  it('switches to course columns when a course is selected', () => {
    const exportDocument = document(true);

    expect(exportDocument.columns.map((column) => column.header)).toEqual([
      'Name',
      'Email',
      'Progress',
      'Now at',
      'Exercise one',
      'Exercise two',
      'Video',
      'Classroom',
      'Certificates',
      'Last login',
      'Status'
    ]);
  });

  it('rounds percentages and leaves an unattempted exercise empty', () => {
    const allCourses = document();
    const course = document(true);
    const allCoursesValue = (key: string) =>
      allCourses.columns.find((column) => column.key === key)?.value(allCourses.rows[0]);
    const courseValue = (key: string) => course.columns.find((column) => column.key === key)?.value(course.rows[0]);

    expect(allCoursesValue('progress')).toBe(72);
    expect(allCoursesValue('average_score')).toBe(82);
    expect(allCoursesValue('video')).toBe(51);
    expect(allCoursesValue('classroom')).toBe(90);
    expect(courseValue('now_at')).toBe('Section one');
    expect(courseValue('exercise_exercise-1')).toBe(67);
    expect(courseValue('exercise_exercise-2')).toBeNull();
  });

  it('uses the translated status label rather than the stored status key', () => {
    const exportDocument = document();
    const status = exportDocument.columns.find((column) => column.key === 'status');

    expect(status?.value(exportDocument.rows[0])).toBe('At risk');
  });
});
