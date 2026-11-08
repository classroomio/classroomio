import type { AttachmentListFile, AttachmentListLabels } from '@cio/ui';
import type { TDocumentBlockData } from '@cio/utils/validation/block';
import { t } from '$lib/utils/functions/translations';
import { snackbar } from '$features/ui/snackbar/store';

const KEY_PREFIX = 'course.navItem.lessons.materials.tabs.document';

export function toAttachmentFile(blockId: string, document: TDocumentBlockData): AttachmentListFile {
  return { id: blockId, name: document.name, size: document.size, type: document.type };
}

export function documentLabels(fileCount: number): AttachmentListLabels {
  return {
    title: t.get(`${KEY_PREFIX}.attachments_heading`),
    fileCount: t.get(`${KEY_PREFIX}.file_count`, { count: fileCount }),
    view: t.get(`${KEY_PREFIX}.view_file`),
    download: t.get(`${KEY_PREFIX}.download`),
    delete: t.get(`${KEY_PREFIX}.delete`),
    reorder: t.get(`${KEY_PREFIX}.reorder_file`)
  };
}

export function viewDocument(document: TDocumentBlockData): void {
  window.open(document.link, '_blank', 'noopener,noreferrer');
}

export async function downloadDocument(document: TDocumentBlockData): Promise<void> {
  try {
    const response = await fetch(document.link);
    if (!response.ok) throw new Error('Failed to fetch document');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = document.name;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    snackbar.success(t.get(`${KEY_PREFIX}.download_success`));
  } catch {
    snackbar.error(t.get(`${KEY_PREFIX}.download_error`));
  }
}
