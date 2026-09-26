import { snackbar } from '$features/ui/snackbar/store';

/**
 * Shared certificate file-download helpers used by the course and learning-path
 * certificate editors. Both editors had identical copies of this logic.
 *
 * A non-OK API response (e.g. the render service failing) throws so callers
 * land in their `catch` block and surface the `preview_failed` snackbar
 * instead of downloading an error payload as a file.
 */
export async function downloadCertificateFile(
  fetcher: () => Promise<Response>,
  filename: string,
  mime: string
): Promise<void> {
  const response = await fetcher();
  if (!response.ok) {
    throw new Error(`Certificate download failed with status ${response.status}`);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(new Blob([blob], { type: mime }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function printCertificateFile(fetcher: () => Promise<Response>, title: string): Promise<void> {
  const printWindow = window.open('', '_blank');

  if (!printWindow) {
    throw new Error('Popup blocked by browser');
  }

  let response: Response;

  try {
    response = await fetcher();

    if (!response.ok) {
      throw new Error(`Certificate download failed with status ${response.status}`);
    }
  } catch (error) {
    printWindow.close();
    throw error;
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const doc = printWindow.document;
  doc.title = title;
  const style = doc.createElement('style');
  style.textContent =
    '@page{size:A4 landscape;margin:0}body{margin:0;display:flex;align-items:center;justify-content:center;background:#fff}img{width:100vw;max-width:1100px;height:auto}';
  doc.head.append(style);
  const img = doc.createElement('img');
  img.alt = '';
  img.onload = () => {
    setTimeout(() => {
      printWindow.print();
      URL.revokeObjectURL(url);
    }, 300);
  };
  img.onerror = () => URL.revokeObjectURL(url);
  img.src = url;
  doc.body.append(img);
}

export function showCertificatePreviewError(): void {
  snackbar.error('certificate.editor.preview_failed');
}
