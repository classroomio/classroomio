import type { ExportDocument } from '@cio/utils/export';
import type { AudienceExportRows } from '$features/org/utils/types';

type AudienceExportRow = AudienceExportRows[number];

type AudienceExportHeaders = {
  name: string;
  email: string;
  memberStatus: string;
  inviteStatus: string;
  joined: string;
  lastLogin: string;
  lastActivity: string;
  enrolled: string;
  completed: string;
  progress: string;
};

function formatTimestamp(value: string | null): string | null {
  if (!value) return null;

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

/** Headers arrive translated; the caller owns copy. */
export function buildAudienceExportDocument(
  rows: AudienceExportRows,
  orgName: string,
  headers: AudienceExportHeaders
): ExportDocument<AudienceExportRow> {
  return {
    filename: `${orgName}-audience-${new Date().toISOString().slice(0, 10)}`,
    title: `${orgName} — ${headers.name}`,
    subtitle: `${rows.length}`,
    columns: [
      { key: 'name', header: headers.name, value: (row) => row.name },
      { key: 'email', header: headers.email, value: (row) => row.email },
      { key: 'memberStatus', header: headers.memberStatus, value: (row) => row.memberStatus },
      { key: 'inviteStatus', header: headers.inviteStatus, value: (row) => row.inviteStatus },
      { key: 'joined', header: headers.joined, value: (row) => row.createdAt },
      { key: 'lastLogin', header: headers.lastLogin, value: (row) => formatTimestamp(row.lastLoginAt) },
      { key: 'lastActivity', header: headers.lastActivity, value: (row) => formatTimestamp(row.lastActiveAt) },
      { key: 'enrolled', header: headers.enrolled, value: (row) => row.enrolledCount },
      { key: 'completed', header: headers.completed, value: (row) => row.completedCount },
      { key: 'progress', header: headers.progress, value: (row) => `${row.progressPercent}%` }
    ],
    rows
  };
}
