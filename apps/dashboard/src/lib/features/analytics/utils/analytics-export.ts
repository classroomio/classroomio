import type { ExportDocument } from '@cio/utils/export';

import type { ExportColumn } from '@cio/utils/export';

import {
  dimensionLabel,
  isAnalyticsStatus,
  numberCell,
  textCell,
  toDonutSegments,
  toHealthSegments
} from './analytics-utils';
import type {
  AnalyticsKpiDisplay,
  AnalyticsResult,
  AnalyticsRow,
  AnalyticsStructureItem,
  AnalyticsWidget,
  StudentExerciseCell,
  StudentExportHeaders
} from './types';

type Translate = (key: string, vars?: Record<string, string | number>) => string;

type WidgetExportRow = Record<string, string | number | null>;

type StudentExportRow = { row: AnalyticsRow; cells: Record<string, StudentExerciseCell> };

function roundOrNull(value: number | null): number | null {
  return value === null ? null : Math.round(value);
}

export function buildStudentsExportDocument(params: {
  filename: string;
  title: string;
  subtitle?: string;
  headers: StudentExportHeaders;
  rows: StudentExportRow[];
  exercises: AnalyticsStructureItem[];
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

        return isAnalyticsStatus(status) ? headers.statusLabels[status] : null;
      }
    }
  ];

  return { filename: params.filename, title: params.title, subtitle: params.subtitle, columns, rows: params.rows };
}

function rowColumn(key: string, header: string): ExportColumn<WidgetExportRow> {
  return { key, header, value: (row) => row[key] ?? null };
}

function humanizeKey(key: string): string {
  const words = key.replace(/__/g, ' ').replace(/_/g, ' ');

  return words.charAt(0).toUpperCase() + words.slice(1);
}

function measureHeader(key: string, translate: Translate): string {
  const path = `analytics.measures.${key}`;
  const translated = translate(path);

  return !translated || translated === path ? humanizeKey(key) : translated;
}

function exportCell(value: AnalyticsRow[string] | undefined, translate: Translate): string | number | null {
  if (typeof value === 'boolean') return translate(value ? 'analytics.export.yes' : 'analytics.export.no');

  return value ?? null;
}

/**
 * The rows behind a widget as the chart shows them: segments for donuts, the headline figure for KPIs, and one
 * labelled row per result row for everything else.
 */
export function buildWidgetExportDocument(params: {
  widget: AnalyticsWidget;
  result: AnalyticsResult;
  title: string;
  subtitle?: string;
  kpi?: AnalyticsKpiDisplay;
  translate: Translate;
}): ExportDocument<WidgetExportRow> {
  const { widget, result, title, subtitle, kpi, translate } = params;
  const document = { filename: title, title, subtitle };
  const dimensions = widget.spec.dimensions ?? [];

  if (widget.viz === 'kpi' && kpi) {
    const columns = [
      rowColumn('metric', translate('analytics.export.columns.metric')),
      rowColumn('value', translate('analytics.export.columns.value')),
      rowColumn('details', translate('analytics.export.columns.details'))
    ];
    const rows = [{ metric: kpi.title ?? title, value: kpi.value, details: kpi.description ?? null }];

    return { ...document, columns, rows };
  }

  const isDonut = widget.viz === 'donut';
  if (isDonut && dimensions[0]) {
    const segments =
      widget.id === 'cohort_health'
        ? toHealthSegments(result, translate)
        : toDonutSegments(result, dimensions[0], translate);
    const columns = [
      rowColumn('segment', translate('analytics.export.columns.segment')),
      rowColumn('students', translate('analytics.columns.students'))
    ];
    const rows = segments.map((segment) => ({ segment: segment.label, students: segment.value }));

    return { ...document, columns, rows };
  }

  const dimensionColumns = dimensions.map((dimension) =>
    rowColumn(`dimension_${dimension}`, translate(`analytics.export.dimensions.${dimension}`))
  );
  const measureColumns = result.columns
    .filter((column) => column.role === 'measure')
    .map((column) => rowColumn(column.key, measureHeader(column.key, translate)));
  const rows = result.rows.map((row) => {
    const entry: WidgetExportRow = {};

    for (const dimension of dimensions) entry[`dimension_${dimension}`] = dimensionLabel(row, dimension, translate);

    for (const column of measureColumns) entry[column.key] = exportCell(row[column.key], translate);

    return entry;
  });

  return { ...document, columns: [...dimensionColumns, ...measureColumns], rows };
}
