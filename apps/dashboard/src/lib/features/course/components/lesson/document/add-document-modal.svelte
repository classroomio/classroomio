<script lang="ts">
  import { lessonDocUpload } from '../store';
  import { snackbar } from '$features/ui/snackbar/store';
  import { t } from '$lib/utils/functions/translations';
  import { Button } from '@cio/ui/base/button';
  import { UpgradeBanner } from '$features/ui';
  import { isFreePlan } from '$lib/utils/store/org';
  import * as Dialog from '@cio/ui/base/dialog';
  import * as FileDropZone from '@cio/ui/custom/file-drop-zone';
  import type { FileRejectedReason } from '@cio/ui/custom/file-drop-zone';
  import { getResolvedUploadLimits } from '$lib/utils/config/upload-limits-context';
  import { LESSON_DOCUMENT_ACCEPTED_TYPES, getFileUploadAcceptAttribute } from '@cio/utils/file-upload';
  import { MAX_DOCUMENT_UPLOAD_FILES, formatUploadFileSize } from '$features/course/utils/document-upload-utils';
  import DocumentUploadCard from './document-upload-card.svelte';
  import { DocumentUploadQueue } from './document-upload-queue.svelte';

  interface Props {
    lessonId?: string;
    onClose?: () => void;
  }

  let { lessonId = '', onClose = () => {} }: Props = $props();

  const keyPrefix = 'course.navItem.lessons.materials.tabs.document';
  const acceptAttribute = getFileUploadAcceptAttribute(LESSON_DOCUMENT_ACCEPTED_TYPES);
  const maxDocumentSize = getResolvedUploadLimits().documentBytes;

  const queue = new DocumentUploadQueue();

  let isDisabled = $derived($isFreePlan);

  function handleOpenChange(isOpen: boolean) {
    if (isOpen) {
      $lessonDocUpload.isModalOpen = true;
      return;
    }

    if (queue.isUploading) {
      $lessonDocUpload.isModalOpen = true;
      return;
    }

    $lessonDocUpload.isModalOpen = false;
    queue.reset();
    onClose();
  }

  async function handleFilesUpload(files: File[]) {
    if ($isFreePlan) {
      snackbar.error($t('upgrade.required'));
      return;
    }

    queue.add(files, lessonId);
  }

  function handleFileRejected(opts: { reason: FileRejectedReason; file: File }) {
    if (opts.reason === 'Maximum file size exceeded') {
      snackbar.error($t(`${keyPrefix}.file_size_error`, { size: formatUploadFileSize(maxDocumentSize) }));
    } else if (opts.reason === 'Maximum files uploaded') {
      snackbar.error($t(`${keyPrefix}.max_files_error`, { count: MAX_DOCUMENT_UPLOAD_FILES }));
    } else if (opts.reason === 'File type not allowed') {
      snackbar.error($t(`${keyPrefix}.file_type_error`));
    } else {
      snackbar.error($t(`${keyPrefix}.upload_error`));
    }
  }
</script>

<Dialog.Root open={$lessonDocUpload.isModalOpen} onOpenChange={handleOpenChange}>
  <Dialog.Content class="max-w-xl!">
    <Dialog.Header>
      <Dialog.Title>{$t(`${keyPrefix}.upload_title`)}</Dialog.Title>
    </Dialog.Header>
    <UpgradeBanner className="mb-3" onClick={() => ($lessonDocUpload.isModalOpen = false)}>
      {$t(`${keyPrefix}.upgrade`)}
    </UpgradeBanner>

    <div class="flex flex-col gap-4 p-6">
      <div class={isDisabled ? 'pointer-events-none opacity-50' : ''}>
        <FileDropZone.Root
          accept={acceptAttribute}
          maxFiles={MAX_DOCUMENT_UPLOAD_FILES}
          fileCount={queue.items.length}
          maxFileSize={maxDocumentSize}
          onUpload={handleFilesUpload}
          onFileRejected={handleFileRejected}
        >
          <FileDropZone.Trigger
            label={$t(`${keyPrefix}.drag_drop`)}
            formatMaxFiles={() => $t(`${keyPrefix}.upload_description`)}
            formatMaxFilesAndSize={(size) => $t(`${keyPrefix}.up_to_size_each`, { size })}
          />
        </FileDropZone.Root>
      </div>

      {#if queue.items.length > 0}
        <div class="flex max-h-[40vh] flex-col gap-2 overflow-y-auto">
          {#each queue.items as item (item.id)}
            <DocumentUploadCard {item} onRemove={(id) => queue.remove(id)} onRetry={(id) => queue.retry(id)} />
          {/each}
        </div>
      {/if}

      {#if queue.allDone}
        <div class="flex justify-end">
          <Button onclick={() => handleOpenChange(false)}>{$t(`${keyPrefix}.finish`)}</Button>
        </div>
      {/if}
    </div>
  </Dialog.Content>
</Dialog.Root>
