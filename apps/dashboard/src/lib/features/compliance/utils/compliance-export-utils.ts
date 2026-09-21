import type { ExportDocument } from '@cio/utils/export';
import type { ComplianceLearnerRow } from './types';

type ComplianceExportHeaders = {
  name: string;
  email: string;
  course: string;
  status: string;
  dueDate: string;
  validUntil: string;
};

function formatDate(value: string | null | undefined): string | null {
  if (!value) return null;

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

/**
 * One row per learner-course obligation. Status arrives already translated via
 * `statusLabel`, so the file reads the same as the table.
 */
export function buildComplianceExportDocument(
  rows: ComplianceLearnerRow[],
  orgName: string,
  headers: ComplianceExportHeaders,
  statusLabel: (status: ComplianceLearnerRow['status']) => string
): ExportDocument<ComplianceLearnerRow> {
  return {
    filename: `${orgName}-compliance-${new Date().toISOString().slice(0, 10)}`,
    title: `${orgName} — ${headers.status}`,
    subtitle: `${rows.length}`,
    columns: [
      { key: 'name', header: headers.name, value: (row) => row.fullname ?? '' },
      { key: 'email', header: headers.email, value: (row) => row.email ?? '' },
      { key: 'course', header: headers.course, value: (row) => row.courseTitle ?? '' },
      { key: 'status', header: headers.status, value: (row) => statusLabel(row.status) },
      { key: 'dueDate', header: headers.dueDate, value: (row) => formatDate(row.dueDate) },
      { key: 'validUntil', header: headers.validUntil, value: (row) => formatDate(row.validUntil) }
    ],
    rows
  };
}
