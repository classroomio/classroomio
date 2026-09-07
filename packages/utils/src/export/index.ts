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

/** Applies a document's columns to one row, in column order. */
export function toExportRecord<Row>(doc: ExportDocument<Row>, row: Row): Record<string, string | number> {
  const record: Record<string, string | number> = {};

  for (const column of doc.columns) {
    const value = column.value(row);
    record[column.header] = value == null || value === '' ? EXPORT_EMPTY_CELL : value;
  }

  return record;
}

export function toExportRecords<Row>(doc: ExportDocument<Row>): Record<string, string | number>[] {
  return doc.rows.map((row) => toExportRecord(doc, row));
}

/** Header row and body cells for renderers that want positional data, such as PDF tables. */
export function toExportMatrix<Row>(doc: ExportDocument<Row>): { head: string[]; body: (string | number)[][] } {
  return {
    head: doc.columns.map((column) => column.header),
    body: doc.rows.map((row) =>
      doc.columns.map((column) => {
        const value = column.value(row);
        return value == null || value === '' ? EXPORT_EMPTY_CELL : value;
      })
    )
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
