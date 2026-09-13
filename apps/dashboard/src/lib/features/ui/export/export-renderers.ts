import Papa from 'papaparse';

import { type ExportDocument, sanitizeExportFilename, toExportMatrix } from '@cio/utils/export';
import { XLSX_MIME_TYPE, buildXlsx } from '@cio/utils/export/xlsx';

export type ExportFormat = 'csv' | 'xlsx' | 'pdf' | 'html';

/** The formats that are text, so they can go to the clipboard as well as to a file. */
export type CopyFormat = 'csv' | 'json' | 'html';

/**
 * The object URL is revoked after the click, so a large export does not pin its
 * bytes for the life of the tab.
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeHtml(value: string | number): string {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Serializers are separate from the download helpers so the clipboard gets the
 * same bytes the file would, rather than a second rendering that can drift.
 */
export function toCsv<Row>(doc: ExportDocument<Row>): string {
  const { head, body } = toExportMatrix(doc);

  // Positional, not keyed by header: two columns sharing a header would collapse.
  return Papa.unparse({ fields: head, data: body });
}

/** One object per row, keyed by column. Headers repeat per row, which is the
 * point: JSON is consumed by a script, not read down a column. */
export function toJson<Row>(doc: ExportDocument<Row>): string {
  const { head, body } = toExportMatrix(doc);
  const rows = body.map((cells) => Object.fromEntries(cells.map((cell, index) => [head[index], cell])));

  return JSON.stringify(rows, null, 2);
}

export function downloadCsv<Row>(doc: ExportDocument<Row>): void {
  // BOM so Excel on Windows reads it as UTF-8.
  const blob = new Blob([`﻿${toCsv(doc)}`], { type: 'text/csv;charset=utf-8;' });

  downloadBlob(blob, `${sanitizeExportFilename(doc.filename)}.csv`);
}

export function downloadXlsx<Row>(doc: ExportDocument<Row>): void {
  const { head, body } = toExportMatrix(doc);
  const bytes = buildXlsx({ name: doc.title, head, body });

  downloadBlob(new Blob([bytes], { type: XLSX_MIME_TYPE }), `${sanitizeExportFilename(doc.filename)}.xlsx`);
}

export async function downloadPdf<Row>(doc: ExportDocument<Row>): Promise<void> {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);

  // Landscape, because these tables are wide by nature.
  const pdf = new jsPDF({ orientation: 'landscape' });
  const { head, body } = toExportMatrix(doc);

  pdf.setFontSize(14);
  pdf.text(doc.title, 14, 16);

  let tableStartY = 24;

  if (doc.subtitle) {
    pdf.setFontSize(10);
    pdf.setTextColor(120);
    pdf.text(doc.subtitle, 14, 22);
    pdf.setTextColor(0);
    tableStartY = 30;
  }

  autoTable(pdf, { head: [head], body, startY: tableStartY, styles: { fontSize: 8 } });

  pdf.save(`${sanitizeExportFilename(doc.filename)}.pdf`);
}

/** Self-contained HTML — no external stylesheet, so it renders the same wherever it lands. */
export function toHtml<Row>(doc: ExportDocument<Row>): string {
  const { head, body } = toExportMatrix(doc);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(doc.title)}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 2rem; color: #18181b; }
  h1 { font-size: 1.25rem; margin: 0 0 0.25rem; }
  p.subtitle { color: #71717a; font-size: 0.875rem; margin: 0 0 1.5rem; }
  table { border-collapse: collapse; width: 100%; font-size: 0.8125rem; }
  th, td { border: 1px solid #e4e4e7; padding: 0.5rem 0.625rem; text-align: left; }
  th { background: #fafafa; font-weight: 600; position: sticky; top: 0; }
  tr:nth-child(even) td { background: #fcfcfc; }
</style>
</head>
<body>
<h1>${escapeHtml(doc.title)}</h1>
${doc.subtitle ? `<p class="subtitle">${escapeHtml(doc.subtitle)}</p>` : ''}
<table>
<thead><tr>${head.map((cell) => `<th>${escapeHtml(cell)}</th>`).join('')}</tr></thead>
<tbody>
${body.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('\n')}
</tbody>
</table>
</body>
</html>`;
}

export function downloadHtml<Row>(doc: ExportDocument<Row>): void {
  downloadBlob(
    new Blob([toHtml(doc)], { type: 'text/html;charset=utf-8;' }),
    `${sanitizeExportFilename(doc.filename)}.html`
  );
}

/** Clipboard writes need a user gesture and a secure context, so the caller
 * reports failure rather than this pretending it worked. */
export async function copyExport<Row>(doc: ExportDocument<Row>, format: CopyFormat): Promise<void> {
  const serialize = { csv: toCsv, json: toJson, html: toHtml }[format];

  await navigator.clipboard.writeText(serialize(doc));
}

export async function downloadExport<Row>(doc: ExportDocument<Row>, format: ExportFormat): Promise<void> {
  if (format === 'csv') return downloadCsv(doc);
  if (format === 'html') return downloadHtml(doc);
  if (format === 'xlsx') return downloadXlsx(doc);

  return downloadPdf(doc);
}
