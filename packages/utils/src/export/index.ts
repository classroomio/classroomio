/**
 * A framework-agnostic description of a tabular export.
 *
 * Deliberately free of Svelte and DOM imports so the API can reuse it for
 * queued or emailed exports later without a rewrite.
 *
 * Headers arrive already translated — this package does not own copy — and all
 * formatting lives in the `value` callback, so CSV and PDF renderings of the
 * same document cannot drift apart.
 */
export interface ExportColumn<Row> {
  key: string;
  /** An already-translated header string. */
  header: string;
  value: (row: Row) => string | number | null;
}

export interface ExportDocument<Row> {
  /** Without extension; the renderer appends one. */
  filename: string;
  /** Rendered as the PDF header. Ignored by CSV. */
  title: string;
  /** Context line, e.g. "Acme · inactive 90+ days · 3,214 learners". */
  subtitle?: string;
  columns: ExportColumn<Row>[];
  rows: Row[];
}

/**
 * A 20,000-row PDF helps nobody, and generating one in the browser will hang
 * the tab long before it finishes. Above this the export menu offers CSV only
 * and says why.
 */
export const PDF_EXPORT_ROW_LIMIT = 2000;

/** Empty cells render as an en dash rather than "null" or a blank the reader has to interpret. */
export const EXPORT_EMPTY_CELL = '–';

/**
 * Neutralizes spreadsheet formula injection.
 *
 * Excel, Sheets and LibreOffice evaluate a cell beginning `=`, `+`, `-` or `@`
 * as a formula, so a learner who sets their display name to
 * `=HYPERLINK(...)` can make a cell fire a request the moment an admin opens
 * the export. Every value here is user-controlled, and the reader is an admin
 * on a trusted machine, which is the worst combination.
 *
 * Prefixing with a tab keeps the text readable and stops evaluation. Applied
 * before RFC 4180 quoting, never instead of it — quoting alone does not
 * prevent evaluation.
 */
export function neutralizeFormula(value: string | number | null): string | number | null {
  if (typeof value !== 'string' || value.length === 0) {
    return value;
  }

  return /^[=+\-@\t\r]/.test(value) ? `\t${value}` : value;
}

/** Resolves one cell: empty placeholder, then formula neutralization. */
function toExportCell<Row>(column: ExportColumn<Row>, row: Row): string | number {
  const value = column.value(row);

  if (value == null || value === '') {
    return EXPORT_EMPTY_CELL;
  }

  return neutralizeFormula(value) as string | number;
}

/**
 * Header row and body cells, positionally.
 *
 * This is the canonical shape both renderers use. Keying cells by header text
 * instead would silently drop a column whenever two share a translated header —
 * which happens as soon as a course has two exercises with the same title, or
 * an exercise is called "Email".
 */
export function toExportMatrix<Row>(doc: ExportDocument<Row>): { head: string[]; body: (string | number)[][] } {
  return {
    head: doc.columns.map((column) => column.header),
    body: doc.rows.map((row) => doc.columns.map((column) => toExportCell(column, row)))
  };
}

/**
 * Makes a filename safe across operating systems and strips the characters a
 * course or organization title can legitimately contain but a file name cannot.
 */
export function sanitizeExportFilename(name: string, fallback = 'export'): string {
  const cleaned = name
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned.length > 0 ? cleaned.slice(0, 120) : fallback;
}
