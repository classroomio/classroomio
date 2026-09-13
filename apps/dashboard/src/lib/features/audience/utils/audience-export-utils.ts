import type { ExportDocument } from '@cio/utils/export';
import { t } from '$lib/utils/functions/translations';
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
    // Same grouping as the table: identity, state, stats, then dates, so the
    // file reads in the order the admin saw on screen.
    columns: [
      { key: 'name', header: headers.name, value: (row) => row.name },
      { key: 'email', header: headers.email, value: (row) => row.email },
      { key: 'memberStatus', header: headers.memberStatus, value: (row) => row.memberStatus },
      { key: 'inviteStatus', header: headers.inviteStatus, value: (row) => row.inviteStatus },
      { key: 'enrolled', header: headers.enrolled, value: (row) => row.enrolledCount },
      { key: 'completed', header: headers.completed, value: (row) => row.completedCount },
      { key: 'progress', header: headers.progress, value: (row) => `${row.progressPercent}%` },
      { key: 'lastLogin', header: headers.lastLogin, value: (row) => formatTimestamp(row.lastLoginAt) },
      { key: 'lastActivity', header: headers.lastActivity, value: (row) => formatTimestamp(row.lastActiveAt) },
      { key: 'joined', header: headers.joined, value: (row) => row.createdAt }
    ],
    rows
  };
}

/**
 * The translated header set, in one place: the page header's export and the
 * selection bar's both build the same document, and a header that drifted
 * between them would produce two different files from one table.
 */
export function audienceExportHeaders(): AudienceExportHeaders {
  return {
    name: t.get('audience.name'),
    email: t.get('audience.email'),
    memberStatus: t.get('audience.filter.status'),
    inviteStatus: t.get('audience.status'),
    joined: t.get('audience.date_joined'),
    lastLogin: t.get('audience.filter.last_login'),
    lastActivity: t.get('audience.filter.last_activity'),
    enrolled: t.get('audience.filter.enrollment'),
    completed: t.get('audience.filter.completed'),
    progress: t.get('audience.progress')
  };
}
