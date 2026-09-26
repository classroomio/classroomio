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

export async function printCertificateFile(
  fetcher: () => Promise<Response>,
  title: string,
  targetWindow?: Window | null
): Promise<void> {
  // Prefer a window opened synchronously in the click handler: popups opened
  // after async work can lose user activation and get blocked with no message.
  const printWindow = targetWindow ?? window.open('', '_blank');

  if (!printWindow) {
    throw new Error('Popup blocked by browser');
  }

  let blob: Blob;

  try {
    const response = await fetcher();

    if (!response.ok) {
      throw new Error(`Certificate download failed with status ${response.status}`);
    }

    blob = await response.blob();
  } catch (error) {
    printWindow.close();
    throw error;
  }

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
