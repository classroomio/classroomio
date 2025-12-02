<script lang="ts">
  import { lessonDocUpload, resetDocumentUploadStore } from '../../store/lessons';
  import { snackbar } from '$lib/components/Snackbar/store';
  import { t } from '$lib/utils/functions/translations';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import FileTextIcon from '@lucide/svelte/icons/file-text';
  import { DocumentUploader } from '$lib/utils/services/courses/presign';
  import { onDestroy, untrack } from 'svelte';
  import { UpgradeBanner } from '$lib/features/ui';
  import { isFreePlan } from '$lib/utils/store/org';
  import { lesson } from '../../store/lessons';
  import { CloseButton } from '$lib/components/Buttons/Close';

  let fileInput: HTMLInputElement | undefined = $state();
  let selectedFile: File | null = $state(null);
  let dragOver = $state(false);
  let errorTimeout: NodeJS.Timeout | null = $state(null);
  let isDisabled = $derived($lessonDocUpload.isUploading || $isFreePlan);

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

  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      selectFile(file);
    }
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

  function handleDrop(event: DragEvent) {
    if (isDisabled) return;

    event.preventDefault();
    dragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      selectFile(files[0]);
    }
  }

  function handleDragOver(event: DragEvent) {
    if (isDisabled) return;

    event.preventDefault();
    dragOver = true;
  }

  function handleDragLeave() {
    if (isDisabled) return;

    dragOver = false;
  }

  async function uploadDocument() {
    if (!selectedFile) return;
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

      lesson.update((state) => ({
        ...state,
        materials: {
          ...(state.materials || {}),
          documents: [...(state.materials.documents || []), document]
        }
      }));
      lessonDocUpload.update((state) => ({
        ...state,
        uploadedDocument: document,
        uploadProgress: 100
      }));

      snackbar.success($t('course.navItem.lessons.materials.tabs.document.upload_success'));

      // Reset after a short delay
      setTimeout(() => {
        resetDocumentUploadStore();
        selectedFile = null;
        if (fileInput) fileInput.value = '';
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
    if (fileInput) fileInput.value = '';
    $lessonDocUpload.error = null;
  }

  function cancelUpload() {
    documentUploader.cancelUpload();

    selectedFile = null;
    if (fileInput) fileInput.value = '';
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

<UpgradeBanner className="mb-3" onClick={() => ($lessonDocUpload.isModalOpen = false)}>
  {$t('course.navItem.lessons.materials.tabs.document.upgrade')}
</UpgradeBanner>

<div class="p-6">
  <div class="mb-6">
    <h3 class="mb-2 text-lg font-semibold">
      {$t('course.navItem.lessons.materials.tabs.document.upload_title')}
    </h3>
    <p class="mb-4 text-sm text-gray-600">
      {$t('course.navItem.lessons.materials.tabs.document.upload_description')}
    </p>
  </div>

  <!-- File Upload Area -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center transition-colors {isDisabled &&
      'opacity-50 hover:cursor-not-allowed'} {dragOver ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-400'}"
    ondrop={handleDrop}
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
  >
    {#if selectedFile}
      <div class="mb-4 flex items-center justify-center space-x-3">
        <FileTextIcon size={16} />
        <div class="text-left">
          <p class="font-medium text-gray-900">{selectedFile.name}</p>
          <p class="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
        </div>
        <CloseButton onClick={removeSelectedFile} />
      </div>
    {:else}
      <FileTextIcon size={16} />
      <p class="mb-2 text-gray-600">
        {$t('course.navItem.lessons.materials.tabs.document.drag_drop')}
      </p>
      <p class="mb-4 text-sm text-gray-500">
        {$t('course.navItem.lessons.materials.tabs.document.or')}
      </p>
      <input
        bind:this={fileInput}
        disabled={isDisabled}
        type="file"
        accept=".pdf,.docx,.doc"
        onchange={handleFileSelect}
        class="hidden"
      />
      <div class="flex justify-center">
        <PrimaryButton
          label={$t('course.navItem.lessons.materials.tabs.document.choose_file')}
          variant={VARIANTS.OUTLINED}
          {isDisabled}
          onClick={() => fileInput?.click()}
        />
      </div>
    {/if}
  </div>

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
        <PrimaryButton
          label={$t('course.navItem.lessons.materials.tabs.document.cancel_upload')}
          variant={VARIANTS.OUTLINED}
          onClick={cancelUpload}
        />
      </div>
    </div>
  {/if}

  <!-- Upload Button -->
  {#if selectedFile && !$lessonDocUpload.isUploading}
    <div class="mt-6 flex justify-end space-x-3">
      <PrimaryButton
        label={$t('course.navItem.lessons.materials.tabs.document.cancel')}
        variant={VARIANTS.OUTLINED}
        onClick={removeSelectedFile}
      />
      <PrimaryButton
        label={$t('course.navItem.lessons.materials.tabs.document.upload_document')}
        onClick={uploadDocument}
        isLoading={$lessonDocUpload.isUploading}
      />
    </div>
  {/if}

  <!-- Success Message -->
  {#if $lessonDocUpload.uploadedDocument}
    <div class="mt-4 rounded-md border border-green-200 bg-green-50 p-3">
      <p class="text-sm text-green-600">
        {$t('course.navItem.lessons.materials.tabs.document.upload_success')}
      </p>
    </div>
  {/if}
</div>
