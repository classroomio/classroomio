<script lang="ts">
  import { AttachmentList } from '@cio/ui';
  import { Button } from '@cio/ui/base/button';
  import { Empty } from '@cio/ui/custom/empty';
  import { t } from '$lib/utils/functions/translations';
  import MODES from '$lib/utils/constants/mode';
  import isEmpty from 'lodash/isEmpty';
  import FileTextIcon from '@lucide/svelte/icons/file-text';
  import type { LessonDocument } from '$features/course/utils/types';
  import { getDocumentIndexByAttachmentId, mapAttachmentsToDocuments, toAttachmentFiles } from './document-utils';

  interface Props {
    mode?: (typeof MODES)[keyof typeof MODES];
    displayDocuments?: LessonDocument[];
    formatFileSize: (bytes: number) => string;
    openDocumentUploadModal: () => void;
    requestRemoveDocument: (index: number) => void;
    onViewDocument: (doc: LessonDocument) => void;
    downloadDocument: (doc: LessonDocument) => Promise<void>;
    reorderDocuments: (documents: LessonDocument[]) => void;
  }

  let {
    mode = MODES.view,
    displayDocuments = [],
    formatFileSize,
    openDocumentUploadModal,
    requestRemoveDocument,
    onViewDocument,
    downloadDocument,
    reorderDocuments
  }: Props = $props();

  const attachmentMode = $derived(mode === MODES.edit ? 'edit' : 'view');
  const attachmentFiles = $derived(toAttachmentFiles(displayDocuments));

  const attachmentLabels = $derived({
    title: t.get('course.navItem.lessons.materials.tabs.document.attachments_heading'),
    fileCount: t.get('course.navItem.lessons.materials.tabs.document.file_count', {
      count: displayDocuments.length
    }),
    view: t.get('course.navItem.lessons.materials.tabs.document.view_file'),
    download: t.get('course.navItem.lessons.materials.tabs.document.download'),
    delete: t.get('course.navItem.lessons.materials.tabs.document.delete'),
    reorder: t.get('course.navItem.lessons.materials.tabs.document.reorder_file')
  });

  function handleView(file: (typeof attachmentFiles)[number]) {
    const index = getDocumentIndexByAttachmentId(displayDocuments, file.id);
    const document = displayDocuments[index];

    if (!document) return;

    onViewDocument(document);
  }

  function handleDownload(file: (typeof attachmentFiles)[number]) {
    const index = getDocumentIndexByAttachmentId(displayDocuments, file.id);
    const document = displayDocuments[index];

    if (!document) return;

    void downloadDocument(document);
  }

  function handleDelete(file: (typeof attachmentFiles)[number]) {
    const index = getDocumentIndexByAttachmentId(displayDocuments, file.id);

    if (index === -1) return;

    requestRemoveDocument(index);
  }

  function handleReorder(files: (typeof attachmentFiles)[number][]) {
    const reorderedDocuments = mapAttachmentsToDocuments(displayDocuments, files);
    reorderDocuments(reorderedDocuments);
  }
</script>

{#if mode === MODES.edit}
  <div class="flex justify-end">
    <Button onclick={openDocumentUploadModal} class="my-4!">
      {$t('course.navItem.lessons.materials.tabs.document.add_document')}
    </Button>
  </div>
{/if}

{#if !isEmpty(displayDocuments)}
  <AttachmentList
    mode={attachmentMode}
    files={attachmentFiles}
    labels={attachmentLabels}
    formatSize={formatFileSize}
    onView={handleView}
    onDownload={attachmentMode === 'view' ? handleDownload : undefined}
    onDelete={attachmentMode === 'edit' ? handleDelete : undefined}
    onReorder={attachmentMode === 'edit' ? handleReorder : undefined}
  />
{:else if mode === MODES.edit}
  <Empty
    title={$t('course.navItem.lessons.materials.tabs.document.empty_title')}
    description={$t('course.navItem.lessons.materials.tabs.document.empty_description')}
    icon={FileTextIcon}
  />
{/if}
