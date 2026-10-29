import type { ExportDocument } from '@cio/utils/export';

import { isInsightsStatus, numberCell, textCell } from './insights-utils';
import type { InsightsRow, InsightsStructureItem, StudentExerciseCell, StudentExportHeaders } from './types';

type StudentExportRow = { row: InsightsRow; cells: Record<string, StudentExerciseCell> };

function roundOrNull(value: number | null): number | null {
  return value === null ? null : Math.round(value);
}

export function buildStudentsExportDocument(params: {
  filename: string;
  title: string;
  subtitle?: string;
  headers: StudentExportHeaders;
  rows: StudentExportRow[];
  exercises: InsightsStructureItem[];
  courseSelected: boolean;
}): ExportDocument<StudentExportRow> {
  const { headers } = params;
  const exerciseColumns = params.exercises.map((exercise) => ({
    key: `exercise_${exercise.id}`,
    header: exercise.title,
    value: (entry: StudentExportRow) => roundOrNull(entry.cells[exercise.id]?.scorePct ?? null)
  }));
  const courseProgressColumns = [
    {
      key: 'now_at',
      header: headers.nowAt,
      value: (entry: StudentExportRow) => {
        const progress = numberCell(entry.row, 'overall_progress_pct__value');

        return progress !== null && progress >= 100 ? headers.finished : textCell(entry.row, 'now_at_title__value');
      }
    },
    ...exerciseColumns
  ];
  const allCoursesColumns = [
    {
      key: 'average_score',
      header: headers.averageScore,
      value: (entry: StudentExportRow) => roundOrNull(numberCell(entry.row, 'avg_score_pct__value'))
    },
    {
      key: 'courses_completed',
      header: headers.coursesCompleted,
      value: (entry: StudentExportRow) => numberCell(entry.row, 'courses_completed__value')
    }
  ];
  const performanceColumns = params.courseSelected ? courseProgressColumns : allCoursesColumns;

  const columns = [
    { key: 'name', header: headers.name, value: (entry: StudentExportRow) => textCell(entry.row, 'name__value') },
    { key: 'email', header: headers.email, value: (entry: StudentExportRow) => textCell(entry.row, 'email__value') },
    {
      key: 'progress',
      header: headers.progress,
      value: (entry: StudentExportRow) => roundOrNull(numberCell(entry.row, 'overall_progress_pct__value'))
    },
    ...performanceColumns,
    {
      key: 'video',
      header: headers.video,
      value: (entry: StudentExportRow) => roundOrNull(numberCell(entry.row, 'video_pct__value'))
    },
    {
      key: 'classroom',
      header: headers.classroom,
      value: (entry: StudentExportRow) => roundOrNull(numberCell(entry.row, 'attendance_pct__value'))
    },
    {
      key: 'certificates',
      header: headers.certificates,
      value: (entry: StudentExportRow) => numberCell(entry.row, 'certificates__value')
    },
    {
      key: 'last_login',
      header: headers.lastLogin,
      value: (entry: StudentExportRow) => textCell(entry.row, 'last_login_at__value')
    },
    {
      key: 'status',
      header: headers.status,
      value: (entry: StudentExportRow) => {
        const status = entry.row['status__value'];

        return isInsightsStatus(status) ? headers.statusLabels[status] : null;
      }
    }
  ];

  return { filename: params.filename, title: params.title, subtitle: params.subtitle, columns, rows: params.rows };
}
