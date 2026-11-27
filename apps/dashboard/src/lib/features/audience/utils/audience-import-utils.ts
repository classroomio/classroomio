import type { ParsedImportRow, TAudienceImportRowStatus } from '@cio/utils/validation/organization';

/** Translation key per row status, so the copy stays out of the parser. */
export const IMPORT_ROW_STATUS_LABEL: Record<TAudienceImportRowStatus, string> = {
  ready: 'audience.import.status.ready',
  already_member: 'audience.import.status.already_member',
  invite_resent: 'audience.import.status.invite_resent',
  invalid_email: 'audience.import.status.invalid_email',
  duplicate_in_file: 'audience.import.status.duplicate_in_file',
  is_staff: 'audience.import.status.is_staff',
  over_seat_limit: 'audience.import.status.over_seat_limit',
  missing_email: 'audience.import.status.missing_email',
  archived: 'audience.import.status.archived',
  already_invited: 'audience.import.status.already_invited'
};

const ALREADY_LISTED_STATUSES: ReadonlySet<TAudienceImportRowStatus> = new Set([
  'already_member',
  'invite_resent',
  'duplicate_in_file',
  'already_invited'
]);

export function summariseImportRows(rows: Pick<ParsedImportRow, 'status'>[]) {
  let ready = 0;
  let alreadyListed = 0;
  let invalid = 0;

  for (const row of rows) {
    if (row.status === 'ready') ready += 1;
    else if (ALREADY_LISTED_STATUSES.has(row.status)) alreadyListed += 1;
    else invalid += 1;
  }

  return { ready, alreadyListed, invalid, total: rows.length };
}

function download(contents: string, filename: string, type: string): void {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement('a');

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadImportTemplate(template: string): void {
  download(template, 'audience-template.csv', 'text/csv;charset=utf-8;');
}

/**
 * The rows that did not import, as a CSV the admin can fix and re-upload.
 * Keeps the reason column so the file explains itself.
 */
export function downloadImportErrorRows(rows: { email: string; name?: string; status: string }[]): void {
  const failed = rows.filter((row) => row.status !== 'ready');
  const body = failed
    .map((row) =>
      [row.email, row.name ?? '', row.status].map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    )
    .join('\r\n');

  download(`email,name,reason\r\n${body}\r\n`, 'audience-import-errors.csv', 'text/csv;charset=utf-8;');
}
