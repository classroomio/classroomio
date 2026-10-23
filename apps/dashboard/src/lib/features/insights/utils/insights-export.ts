import type { ExportDocument } from '@cio/utils/export';

import { isInsightsStatus, numberCell, textCell } from './insights-utils';
import type { InsightsRow, InsightsStructureItem, LearnerExerciseCell, LearnerExportHeaders } from './types';

type LearnerExportRow = { row: InsightsRow; cells: Record<string, LearnerExerciseCell> };

function roundOrNull(value: number | null): number | null {
  return value === null ? null : Math.round(value);
}

export function buildLearnersExportDocument(params: {
  filename: string;
  title: string;
  subtitle?: string;
  headers: LearnerExportHeaders;
  rows: LearnerExportRow[];
  exercises: InsightsStructureItem[];
}): ExportDocument<LearnerExportRow> {
  const { headers } = params;
  const exerciseColumns = params.exercises.map((exercise) => ({
    key: `exercise_${exercise.id}`,
    header: exercise.title,
    value: (entry: LearnerExportRow) => roundOrNull(entry.cells[exercise.id]?.scorePct ?? null)
  }));

  const columns = [
    { key: 'name', header: headers.name, value: (entry: LearnerExportRow) => textCell(entry.row, 'name__value') },
    { key: 'email', header: headers.email, value: (entry: LearnerExportRow) => textCell(entry.row, 'email__value') },
    {
      key: 'progress',
      header: headers.progress,
      value: (entry: LearnerExportRow) => roundOrNull(numberCell(entry.row, 'overall_progress_pct__value'))
    },
    {
      key: 'average_score',
      header: headers.averageScore,
      value: (entry: LearnerExportRow) => roundOrNull(numberCell(entry.row, 'avg_score_pct__value'))
    },
    {
      key: 'courses_completed',
      header: headers.coursesCompleted,
      value: (entry: LearnerExportRow) => numberCell(entry.row, 'courses_completed__value')
    },
    ...exerciseColumns,
    {
      key: 'video',
      header: headers.video,
      value: (entry: LearnerExportRow) => roundOrNull(numberCell(entry.row, 'video_pct__value'))
    },
    {
      key: 'classroom',
      header: headers.classroom,
      value: (entry: LearnerExportRow) => roundOrNull(numberCell(entry.row, 'attendance_pct__value'))
    },
    {
      key: 'certificates',
      header: headers.certificates,
      value: (entry: LearnerExportRow) => numberCell(entry.row, 'certificates__value')
    },
    {
      key: 'last_login',
      header: headers.lastLogin,
      value: (entry: LearnerExportRow) => textCell(entry.row, 'last_login_at__value')
    },
    {
      key: 'status',
      header: headers.status,
      value: (entry: LearnerExportRow) => {
        const status = entry.row['status__value'];

        return isInsightsStatus(status) ? headers.statusLabels[status] : null;
      }
    }
  ];

  return { filename: params.filename, title: params.title, subtitle: params.subtitle, columns, rows: params.rows };
}
