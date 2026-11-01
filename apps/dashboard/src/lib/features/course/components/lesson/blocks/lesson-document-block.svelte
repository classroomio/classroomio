<script lang="ts">
  import { DocumentBlock } from '@cio/ui';
  import type { AttachmentListFile } from '@cio/ui';
  import { t } from '$lib/utils/functions/translations';
  import MODES from '$lib/utils/constants/mode';
  import { lessonApi } from '$features/course/api';
  import { lessonDocumentKey } from '$features/course/utils/lesson-blocks';
  import { snackbar } from '$features/ui/snackbar/store';
  import type { LessonDocumentBlock } from '$features/course/utils/types';

  type LessonDocument = NonNullable<NonNullable<typeof lessonApi.lesson>['documents']>[number];

  interface Props {
    block: LessonDocumentBlock;
    mode: (typeof MODES)[keyof typeof MODES];
    changeLabel?: string;
    onChange?: () => void;
  }

  let { block, mode, changeLabel, onChange }: Props = $props();

  const legacyDocument = $derived(
    block.isExample
      ? undefined
      : (lessonApi.lesson?.documents ?? []).find((candidate) => lessonDocumentKey(candidate) === block.sourceKey)
  );
  const embeddedDocument = $derived(
    !block.isExample && !legacyDocument && block.data?.name ? (block.data as unknown as LessonDocument) : undefined
  );
  const document = $derived(legacyDocument ?? embeddedDocument);
  const files = $derived<AttachmentListFile[]>(
    block.isExample
      ? [{ id: block.id, name: 'Empty.pdf', size: 0, type: 'pdf' }]
      : document
        ? [
            {
              id: lessonDocumentKey(document),
              name: document.name,
              size: document.size,
              type: document.type
            }
          ]
        : []
  );
  const labels = $derived({
    title: t.get('course.navItem.lessons.materials.tabs.document.attachments_heading'),
    fileCount: t.get('course.navItem.lessons.materials.tabs.document.file_count', { count: files.length }),
    view: t.get('course.navItem.lessons.materials.tabs.document.view_file'),
    download: t.get('course.navItem.lessons.materials.tabs.document.download'),
    delete: t.get('course.navItem.lessons.materials.tabs.document.delete'),
    reorder: t.get('course.navItem.lessons.materials.tabs.document.reorder_file')
  });

  function viewDocument(): void {
    if (!document) return;

    window.open(document.link, '_blank', 'noopener,noreferrer');
  }

  async function downloadDocument(): Promise<void> {
    if (!document) return;

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
      snackbar.success(t.get('course.navItem.lessons.materials.tabs.document.download_success'));
    } catch {
      snackbar.error(t.get('course.navItem.lessons.materials.tabs.document.download_error'));
    }
  }
</script>

{#if document || block.isExample}
  <DocumentBlock
    editable={mode === MODES.edit}
    {files}
    {labels}
    {changeLabel}
    {onChange}
    onView={block.isExample ? undefined : viewDocument}
    onDownload={block.isExample ? undefined : downloadDocument}
  />
{/if}
