import Papa from 'papaparse';

import { type ExportDocument, sanitizeExportFilename, toExportMatrix, toExportRecords } from '@cio/utils/export';

/**
 * Triggers a browser download for a generated blob.
 *
 * The object URL is revoked after the click so a large export does not pin its
 * bytes in memory for the life of the tab.
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

export function downloadCsv<Row>(doc: ExportDocument<Row>): void {
  const csv = Papa.unparse(toExportRecords(doc));
  // The BOM is what makes Excel open UTF-8 correctly on Windows; without it,
  // accented names in a learner roster arrive mangled.
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });

  downloadBlob(blob, `${sanitizeExportFilename(doc.filename)}.csv`);
}

/**
 * jspdf and jspdf-autotable are loaded on demand: they are large, and most
 * sessions never export a PDF.
 */
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
