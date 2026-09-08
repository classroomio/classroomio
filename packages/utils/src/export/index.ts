/**
 * A framework-agnostic description of a tabular export. No Svelte or DOM
 * imports, so the API can reuse it for queued or emailed exports.
 */
export interface ExportColumn<Row> {
  key: string;
  /** Already translated — this package does not own copy. */
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

/** Above this a browser-side PDF hangs the tab, so the menu offers CSV only. */
export const PDF_EXPORT_ROW_LIMIT = 2000;

export const EXPORT_EMPTY_CELL = '–';

/**
 * Characters that make a spreadsheet treat a cell as a formula.
 *
 * Tab, CR and LF are included because spreadsheets skip leading whitespace
 * before deciding, and the full-width variants because several applications
 * normalize them to ASCII — both bypass a check on `=` alone.
 */
const FORMULA_PREFIX = /^[=+\-@\t\r\n＝＋－＠]/;

/**
 * Defuses spreadsheet formula injection. Every value in these exports is
 * user-controlled and the reader is an admin on a trusted machine.
 *
 * Runs before RFC 4180 quoting, not instead of it — quoting does not prevent
 * evaluation.
 */
export function neutralizeFormula(value: string | number | null): string | number | null {
  if (typeof value !== 'string' || value.length === 0) {
    return value;
  }

  return FORMULA_PREFIX.test(value) ? `\t${value}` : value;
}

function toExportCell<Row>(column: ExportColumn<Row>, row: Row): string | number {
  const value = column.value(row);

  if (value == null || value === '') {
    return EXPORT_EMPTY_CELL;
  }

  return neutralizeFormula(value) as string | number;
}

/**
 * The canonical shape both renderers consume. Positional rather than keyed by
 * header: two columns sharing a translated header would otherwise collapse
 * into one, which happens as soon as a course has two exercises alike.
 */
export function toExportMatrix<Row>(doc: ExportDocument<Row>): { head: string[]; body: (string | number)[][] } {
  return {
    // Headers are user-controlled too — an exercise title becomes a header.
    head: doc.columns.map((column) => neutralizeFormula(column.header) as string),
    body: doc.rows.map((row) => doc.columns.map((column) => toExportCell(column, row)))
  };
}

export function sanitizeExportFilename(name: string, fallback = 'export'): string {
  const cleaned = name
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned.length > 0 ? cleaned.slice(0, 120) : fallback;
}
