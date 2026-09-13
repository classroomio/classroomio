import * as z from 'zod';

/**
 * Rows per import. The questionnaire asked for an explicit limit; this is it.
 * Above this the admin splits the file, which keeps one import inside a single
 * request and one seat check.
 */
export const AUDIENCE_IMPORT_MAX_ROWS = 1000;

/** 5 MB. A 1,000-row roster is a few tens of kilobytes, so this is generous. */
export const AUDIENCE_IMPORT_MAX_FILE_BYTES = 5 * 1024 * 1024;

/** Accepted upload types. UTF-8 CSV only — see the PRD on `.xlsx`. */
export const AUDIENCE_IMPORT_ACCEPT = '.csv,text/csv';

/**
 * Why a row cannot be imported. Returned per row rather than failing the batch,
 * so one bad address in a 900-row file does not reject the other 899.
 */
export const AudienceImportRowStatus = z.enum([
  'ready',
  'already_member',
  'invalid_email',
  'duplicate_in_file',
  'is_staff',
  'over_seat_limit',
  'missing_email'
]);
export type TAudienceImportRowStatus = z.infer<typeof AudienceImportRowStatus>;

export const ZAudienceImportRecipient = z.object({
  email: z.string().trim().toLowerCase(),
  /** Falls back to the email local-part, as the audience list already does. */
  name: z.string().trim().max(200).optional(),
  /** Course titles or ids. Unmatched values become row warnings, not failures. */
  courses: z.array(z.string().trim()).optional()
});
export type TAudienceImportRecipient = z.infer<typeof ZAudienceImportRecipient>;

export const ZImportAudienceMembers = z
  .object({
    /** Structured rows, from a parsed file. Preferred. */
    recipients: z.array(ZAudienceImportRecipient).max(AUDIENCE_IMPORT_MAX_ROWS).optional(),
    /** The original paste-a-list field, kept so existing callers keep working. */
    recipientCsv: z.string().max(25000).optional(),
    courseIds: z.array(z.string().uuid()).optional(),
    cohortIds: z.array(z.string().uuid()).optional(),
    allCourses: z.boolean().optional().default(false),
    allCohorts: z.boolean().optional().default(false),
    sendEmail: z.boolean().default(true)
  })
  .refine((data) => Boolean(data.recipients?.length) || Boolean(data.recipientCsv?.trim()), {
    message: 'Provide at least one recipient',
    path: ['recipients']
  });

export type TImportAudienceMembers = z.infer<typeof ZImportAudienceMembers>;

export type AudienceImportRowResult = {
  email: string;
  name?: string;
  status: TAudienceImportRowStatus;
  /** Course values that matched nothing. Advisory — the row still imports. */
  unmatchedCourses?: string[];
};

export type AudienceImportResult = {
  imported: number;
  enrolled: number;
  /** Every row the caller submitted, in order, with its outcome. */
  rows: AudienceImportRowResult[];
  emailsSent: number;
  emailsFailed: number;
};

/** Column aliases accepted in the header row, so a hand-made file still parses. */
const HEADER_ALIASES: Record<string, 'email' | 'name' | 'courses'> = {
  email: 'email',
  'email address': 'email',
  'e-mail': 'email',
  mail: 'email',
  name: 'name',
  'full name': 'name',
  fullname: 'name',
  student: 'name',
  courses: 'courses',
  course: 'courses'
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isImportableEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim().toLowerCase());
}

/** The template offered for download, so the expected shape is unambiguous. */
export const AUDIENCE_IMPORT_TEMPLATE =
  'email,name,courses\nada@example.com,Ada Lovelace,"Intro to React,Data Basics"\n';

export type ParsedImportRow = {
  /** 1-based row number in the source file, for error messages. */
  line: number;
  email: string;
  name?: string;
  courses: string[];
  status: TAudienceImportRowStatus;
};

export type ParsedImport = {
  rows: ParsedImportRow[];
  /** True when a recognised header row was consumed. */
  hadHeader: boolean;
  /** Header columns present in the file but not understood. */
  unknownColumns: string[];
  /** Rows beyond `AUDIENCE_IMPORT_MAX_ROWS`, which are not returned. */
  truncated: number;
};

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      // A doubled quote inside a quoted cell is a literal quote.
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
        continue;
      }

      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      cells.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  cells.push(current);

  return cells.map((cell) => cell.trim());
}

/**
 * Parses an uploaded CSV, or a pasted list of addresses, into rows with a
 * status each.
 *
 * The header row is optional: a file whose first line is just an address is
 * treated as data, so pasting a column of emails works without ceremony. Rows
 * are classified here — duplicates and malformed addresses included — so the
 * preview can show the admin what will happen before anything is written.
 */
export function parseAudienceImportCsv(text: string): ParsedImport {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return { rows: [], hadHeader: false, unknownColumns: [], truncated: 0 };
  }

  const firstCells = splitCsvLine(lines[0]);
  const looksLikeHeader =
    firstCells.some((cell) => HEADER_ALIASES[cell.toLowerCase()] !== undefined) &&
    !firstCells.some((cell) => isImportableEmail(cell));

  let columns: ('email' | 'name' | 'courses' | null)[] = ['email'];
  const unknownColumns: string[] = [];

  if (looksLikeHeader) {
    columns = firstCells.map((cell) => {
      const mapped = HEADER_ALIASES[cell.toLowerCase()];

      if (!mapped) {
        unknownColumns.push(cell);
        return null;
      }

      return mapped;
    });
  }

  const dataLines = looksLikeHeader ? lines.slice(1) : lines;
  const seen = new Set<string>();
  const rows: ParsedImportRow[] = [];
  let truncated = 0;

  for (let index = 0; index < dataLines.length; index += 1) {
    if (rows.length >= AUDIENCE_IMPORT_MAX_ROWS) {
      truncated = dataLines.length - index;
      break;
    }

    const line = looksLikeHeader ? index + 2 : index + 1;
    const cells = splitCsvLine(dataLines[index]);

    // Without a header the whole line is the address, so a pasted
    // comma-separated list yields one row per address rather than one row with
    // many cells.
    const emailCandidates = looksLikeHeader
      ? [cells[columns.indexOf('email')] ?? '']
      : cells.filter((cell) => cell.length > 0);

    for (const raw of emailCandidates.length > 0 ? emailCandidates : ['']) {
      if (rows.length >= AUDIENCE_IMPORT_MAX_ROWS) break;

      const email = raw.trim().toLowerCase();

      if (!email) {
        rows.push({ line, email: '', courses: [], status: 'missing_email' });
        continue;
      }

      if (!isImportableEmail(email)) {
        rows.push({ line, email, courses: [], status: 'invalid_email' });
        continue;
      }

      const nameIndex = columns.indexOf('name');
      const coursesIndex = columns.indexOf('courses');
      const name = nameIndex >= 0 ? cells[nameIndex]?.trim() || undefined : undefined;
      const courses =
        coursesIndex >= 0
          ? (cells[coursesIndex] ?? '')
              .split(',')
              .map((value) => value.trim())
              .filter(Boolean)
          : [];

      if (seen.has(email)) {
        rows.push({ line, email, name, courses, status: 'duplicate_in_file' });
        continue;
      }

      seen.add(email);
      rows.push({ line, email, name, courses, status: 'ready' });
    }
  }

  return { rows, hadHeader: looksLikeHeader, unknownColumns, truncated };
}
