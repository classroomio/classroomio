<script lang="ts">
  import { lessonDocUpload } from '../store';
  import { snackbar } from '$features/ui/snackbar/store';
  import { t } from '$lib/utils/functions/translations';
  import { Button } from '@cio/ui/base/button';
  import { UpgradeBanner } from '$features/ui';
  import { isFreePlan } from '$lib/utils/store/org';
  import * as Dialog from '@cio/ui/base/dialog';
  import * as UnderlineTabs from '@cio/ui/custom/underline-tabs';
  import LibraryIcon from '@lucide/svelte/icons/library';
  import UploadIcon from '@lucide/svelte/icons/upload';
  import * as FileDropZone from '@cio/ui/custom/file-drop-zone';
  import type { FileRejectedReason } from '@cio/ui/custom/file-drop-zone';
  import { getResolvedUploadLimits } from '$lib/utils/config/upload-limits-context';
  import { formatFileSize } from '@cio/ui/custom/attachment-list';
  import { LESSON_DOCUMENT_ACCEPTED_TYPES, getFileUploadAcceptAttribute } from '@cio/utils/file-upload';
  import { MAX_DOCUMENT_UPLOAD_FILES } from '$features/course/utils/document-upload-utils';
  import { UploadFileCard } from '@cio/ui/custom/upload-file-card';
  import type { UploadFileCardLabels } from '@cio/ui/custom/upload-file-card';
  import { DocumentUploadQueue } from './document-upload-queue.svelte';
  import LibraryDocument from './library-document.svelte';

  interface Props {
    lessonId?: string;
    onClose?: () => void;
  }

  let { lessonId = '', onClose = () => {} }: Props = $props();

  const keyPrefix = 'course.navItem.lessons.materials.tabs.document';
  const acceptAttribute = getFileUploadAcceptAttribute(LESSON_DOCUMENT_ACCEPTED_TYPES);
  const maxDocumentSize = getResolvedUploadLimits().documentBytes;

  const queue = new DocumentUploadQueue();

  let currentTab = $state('upload');

  let isDisabled = $derived($isFreePlan);

  let cardLabels: UploadFileCardLabels = $derived({
    queued: $t(`${keyPrefix}.queued`),
    completed: $t(`${keyPrefix}.completed`),
    failed: $t(`${keyPrefix}.failed`),
    retry: $t(`${keyPrefix}.try_again`),
    remove: $t(`${keyPrefix}.remove_document`),
    uploading: (percent) => $t(`${keyPrefix}.uploading_progress`, { percent }),
    transferred: (uploaded, total) => $t(`${keyPrefix}.size_progress`, { uploaded, total })
  });

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
    currentTab = 'upload';
    queue.reset();
    onClose();
  }

  async function handleFilesUpload(files: File[]) {
    if ($isFreePlan) {
      snackbar.error($t('upgrade.required'));
      return;
    }

    const rejectedFiles = queue.add(files, lessonId);

    if (rejectedFiles.length > 0) {
      snackbar.error($t(`${keyPrefix}.file_type_error`));
    }
  }

  function handleFileRejected(opts: { reason: FileRejectedReason; file: File }) {
    if (opts.reason === 'Maximum file size exceeded') {
      snackbar.error($t(`${keyPrefix}.file_size_error`, { size: formatFileSize(maxDocumentSize) }));
    } else if (opts.reason === 'Maximum files uploaded') {
      snackbar.error($t(`${keyPrefix}.max_files_error`, { count: MAX_DOCUMENT_UPLOAD_FILES }));
    } else if (opts.reason === 'File type not allowed') {
      snackbar.error($t(`${keyPrefix}.file_type_error`));
    } else {
      snackbar.error($t(`${keyPrefix}.upload_error`));
    }
  }
</script>

{#snippet uploadPanel()}
  <div class="flex flex-col gap-4 pb-3">
    {#if queue.items.length === 0}
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
    {:else}
      <div class="flex max-h-[40vh] flex-col gap-2 overflow-y-auto">
        {#each queue.items as item (item.id)}
          <UploadFileCard
            name={item.file.name}
            size={item.file.size}
            status={item.status}
            progress={item.progress}
            errorMessage={item.errorMessage ?? $t(`${keyPrefix}.upload_error`)}
            labels={cardLabels}
            onRemove={() => queue.remove(item.id)}
            onRetry={() => queue.retry(item.id)}
          />
        {/each}
      </div>
    {/if}

    {#if queue.allDone}
      <div class="flex justify-end">
        <Button onclick={() => handleOpenChange(false)}>{$t(`${keyPrefix}.finish`)}</Button>
      </div>
    {/if}
  </div>
{/snippet}

<Dialog.Root open={$lessonDocUpload.isModalOpen} onOpenChange={handleOpenChange}>
  <Dialog.Content class="max-w-xl!">
    <Dialog.Header>
      <Dialog.Title>{$t(`${keyPrefix}.upload_title`)}</Dialog.Title>
    </Dialog.Header>
    <UpgradeBanner className="mb-3" onClick={() => ($lessonDocUpload.isModalOpen = false)}>
      {$t(`${keyPrefix}.upgrade`)}
    </UpgradeBanner>

    {#if lessonId}
      <UnderlineTabs.Root bind:value={currentTab} class="min-w-0">
        <UnderlineTabs.List>
          <UnderlineTabs.Trigger
            value="upload"
            disabled={queue.isUploading && currentTab !== 'upload'}
            class="flex items-center gap-2"
          >
            <UploadIcon />
            <span>{$t('course.navItem.lessons.materials.tabs.video.upload')}</span>
          </UnderlineTabs.Trigger>
          <UnderlineTabs.Trigger
            value="library"
            disabled={queue.isUploading && currentTab !== 'library'}
            class="flex items-center gap-2"
          >
            <LibraryIcon />
            <span>{$t('course.navItem.lessons.materials.tabs.video.library')}</span>
          </UnderlineTabs.Trigger>
        </UnderlineTabs.List>
        <UnderlineTabs.Content value="upload" class="mt-3">
          {@render uploadPanel()}
        </UnderlineTabs.Content>
        <UnderlineTabs.Content value="library" class="mt-3">
          <LibraryDocument {lessonId} />
        </UnderlineTabs.Content>
      </UnderlineTabs.Root>
    {:else}
      {@render uploadPanel()}
    {/if}
  </Dialog.Content>
</Dialog.Root>
