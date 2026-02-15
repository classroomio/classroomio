<script lang="ts">
  import { lessonDocUpload, resetDocumentUploadStore } from '../store';
  import { snackbar } from '$features/ui/snackbar/store';
  import { t } from '$lib/utils/functions/translations';
  import { Button } from '@cio/ui/base/button';
  import FileTextIcon from '@lucide/svelte/icons/file-text';
  import { DocumentUploader } from '$lib/utils/services/courses/presign';
  import { onDestroy, untrack } from 'svelte';
  import { UpgradeBanner, CloseButton } from '$features/ui';
  import { isFreePlan } from '$lib/utils/store/org';
  import { lessonApi } from '$features/course/api';
  import type { Lesson } from '$features/course/utils/types';
  import * as Dialog from '@cio/ui/base/dialog';
  import * as FileDropZone from '@cio/ui/custom/file-drop-zone';
  import type { FileRejectedReason } from '@cio/ui/custom/file-drop-zone';

  interface Props {
    onClose?: () => void;
  }

  let { onClose = () => {} }: Props = $props();

  let selectedFile: File | null = $state(null);
  let errorTimeout: NodeJS.Timeout | null = $state(null);
  let isDisabled = $derived($lessonDocUpload.isUploading || $isFreePlan);

  let uploadedDocument: NonNullable<Lesson['documents']>[number] | null = $state(null);

  const ALLOWED_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ];

  const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024; // 5MB

  const documentUploader = new DocumentUploader();

  function getFileType(file: File): 'pdf' | 'docx' | 'doc' {
    if (file.type === 'application/pdf') return 'pdf';
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx';
    if (file.type === 'application/msword') return 'doc';
    return 'pdf'; // fallback
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function validateFile(file: File): string | null {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return $t('course.navItem.lessons.materials.tabs.document.file_type_error');
    }

    if (file.size > MAX_DOCUMENT_SIZE) {
      return $t('course.navItem.lessons.materials.tabs.document.file_size_error', {
        size: formatFileSize(MAX_DOCUMENT_SIZE)
      });
    }

    return null;
  }

  function selectFile(file: File) {
    const error = validateFile(file);
    if (error) {
      snackbar.error(error);
      return;
    }

    selectedFile = file;
    $lessonDocUpload.error = null;
  }

  async function handleFilesUpload(files: File[]) {
    const file = files[0];
    if (file) selectFile(file);
  }

  function handleFileRejected(opts: { reason: FileRejectedReason; file: File }) {
    if (opts.reason === 'Maximum file size exceeded') {
      snackbar.error(
        $t('course.navItem.lessons.materials.tabs.document.file_size_error', {
          size: formatFileSize(MAX_DOCUMENT_SIZE)
        })
      );
    } else if (opts.reason === 'File type not allowed') {
      snackbar.error($t('course.navItem.lessons.materials.tabs.document.file_type_error'));
    } else {
      snackbar.error($t('course.navItem.lessons.materials.tabs.document.upload_error'));
    }
  }

  async function uploadDocument() {
    if (!selectedFile) return;

    // Prevent free plan users from bypassing UI restrictions
    if ($isFreePlan) {
      $lessonDocUpload.error = $t('upgrade.required');

      snackbar.error($lessonDocUpload.error!);
      return;
    }

    $lessonDocUpload.isUploading = true;

    try {
      const { url: presignedUrl, fileKey } = await documentUploader.getPresignedUrl(selectedFile);

      await documentUploader.uploadFile({
        url: presignedUrl,
        file: selectedFile
      });

      const { urls: presignedUrls } = await documentUploader.getDownloadPresignedUrl([fileKey]);

      const document = {
        type: getFileType(selectedFile),
        name: selectedFile.name,
        link: presignedUrls[fileKey],
        key: fileKey,
        size: selectedFile.size
      };

      lessonApi.updateLessonState('documents', [document], { append: true });

      uploadedDocument = document;
      lessonDocUpload.update((state) => ({
        ...state,
        uploadProgress: 100
      }));

      snackbar.success($t('course.navItem.lessons.materials.tabs.document.upload_success'));

      // Reset after a short delay
      setTimeout(() => {
        resetDocumentUploadStore();
        selectedFile = null;
      }, 1500);
    } catch (error) {
      console.error('Upload error:', error);

      if ($lessonDocUpload.isCancelled) {
        $lessonDocUpload.error = $t('course.navItem.lessons.materials.tabs.document.upload_cancelled');
        snackbar.info($t('course.navItem.lessons.materials.tabs.document.upload_cancelled'));
      } else {
        $lessonDocUpload.error = error instanceof Error ? error.message : 'Upload failed';
        snackbar.error($t('course.navItem.lessons.materials.tabs.document.upload_error'));
      }
    } finally {
      $lessonDocUpload.isUploading = false;
    }
  }

  function removeSelectedFile() {
    selectedFile = null;
    $lessonDocUpload.error = null;
  }

  function cancelUpload() {
    documentUploader.cancelUpload();
    selectedFile = null;
  }

  function autoClearError(error: string | null) {
    if (!error) {
      return;
    }

    if (errorTimeout) clearTimeout(errorTimeout);

    errorTimeout = setTimeout(() => {
      untrack(() => {
        $lessonDocUpload.error = null;
      });
    }, 5000);
  }

  // Auto-clear error after 5 seconds
  $effect(() => {
    autoClearError($lessonDocUpload.error);
  });

  // Clear error timeout when component is destroyed
  onDestroy(() => {
    if (errorTimeout) clearTimeout(errorTimeout);
  });
</script>

<Dialog.Root
  bind:open={$lessonDocUpload.isModalOpen}
  onOpenChange={(isOpen) => {
    if (!isOpen) onClose();
  }}
>
  <Dialog.Content class="w-[90%] max-w-4/5">
    <Dialog.Header>
      <Dialog.Title>{$t('course.navItem.lessons.materials.tabs.document.upload_title')}</Dialog.Title>
    </Dialog.Header>
    <UpgradeBanner className="mb-3" onClick={() => ($lessonDocUpload.isModalOpen = false)}>
      {$t('course.navItem.lessons.materials.tabs.document.upgrade')}
    </UpgradeBanner>

    <div class="p-6">
      <!-- File Upload Area -->
      {#if selectedFile}
        <div class="border-border mb-4 flex items-center justify-center space-x-3 rounded-lg border p-4">
          <FileTextIcon class="ui:text-muted-foreground size-5 shrink-0" />
          <div class="min-w-0 flex-1 text-left">
            <p class="ui:text-foreground truncate font-medium">{selectedFile.name}</p>
            <p class="ui:text-muted-foreground text-sm">{formatFileSize(selectedFile.size)}</p>
          </div>
          <CloseButton onClick={removeSelectedFile} />
        </div>
      {:else}
        <div class={isDisabled ? 'ui:opacity-50 ui:pointer-events-none' : ''}>
          <FileDropZone.Root
            accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
            maxFiles={1}
            fileCount={0}
            maxFileSize={MAX_DOCUMENT_SIZE}
            onUpload={handleFilesUpload}
            onFileRejected={handleFileRejected}
          >
            <FileDropZone.Trigger
              label={$t('course.navItem.lessons.materials.tabs.document.drag_drop')}
              formatMaxFiles={(_count) => $t('course.navItem.lessons.materials.tabs.document.upload_description')}
              formatMaxFilesAndSize={(size) => `(up to ${size})`}
              formatMaxSize={(size) =>
                $t('course.navItem.lessons.materials.tabs.document.upload_description') + ` (${size})`}
            />
          </FileDropZone.Root>
        </div>
      {/if}

      <!-- Error Message -->
      {#if $lessonDocUpload.error}
        <div class="mt-4 rounded-md border border-red-200 bg-red-50 p-3">
          <p class="text-sm text-red-600">{$lessonDocUpload.error}</p>
        </div>
      {/if}

      <!-- Upload Progress -->
      {#if $lessonDocUpload.isUploading}
        <div class="mt-4">
          <div class="mb-1 flex justify-between text-sm text-gray-600">
            <span>{$t('course.navItem.lessons.materials.tabs.document.uploading')}</span>
            <span>{$lessonDocUpload.uploadProgress}%</span>
          </div>
          <div class="h-2 w-full rounded-full bg-gray-200">
            <div
              class="h-2 rounded-full bg-blue-600 transition-all duration-300"
              style="width: {$lessonDocUpload.uploadProgress}%"
            ></div>
          </div>
          <div class="mt-3 flex justify-center">
            <Button variant="outline" onclick={cancelUpload}>
              {$t('course.navItem.lessons.materials.tabs.document.cancel_upload')}
            </Button>
          </div>
        </div>
      {/if}

      <!-- Upload Button -->
      {#if selectedFile && !$lessonDocUpload.isUploading}
        <div class="mt-6 flex justify-end space-x-3">
          <Button variant="outline" onclick={removeSelectedFile}>
            {$t('course.navItem.lessons.materials.tabs.document.cancel')}
          </Button>
          <Button
            onclick={uploadDocument}
            loading={$lessonDocUpload.isUploading}
            disabled={$lessonDocUpload.isUploading}
          >
            {$t('course.navItem.lessons.materials.tabs.document.upload_document')}
          </Button>
        </div>
      {/if}

      <!-- Success Message -->
      {#if uploadedDocument}
        <div class="mt-4 rounded-md border border-green-200 bg-green-50 p-3">
          <p class="text-sm text-green-600">
            {$t('course.navItem.lessons.materials.tabs.document.upload_success')}
          </p>
        </div>
      {/if}
    </div>
  </Dialog.Content>
</Dialog.Root>
