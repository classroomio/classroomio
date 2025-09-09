<script lang="ts">
  import { uploadCourseDocumentStore, resetDocumentUploadStore } from '../../store/lessons';
  import { snackbar } from '$lib/components/Snackbar/store';
  import { t } from '$lib/utils/functions/translations';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import DocumentIcon from 'carbon-icons-svelte/lib/Document.svelte';
  import PdfIcon from 'carbon-icons-svelte/lib/Pdf.svelte';
  import CloseIcon from 'carbon-icons-svelte/lib/Close.svelte';
  import { lesson } from '../../store/lessons';
  import { apiClient } from '$lib/utils/services/api';
  import axios from 'axios';

  export let lessonId = '';

  let fileInput: HTMLInputElement;
  let selectedFile: File | null = null;
  let dragOver = false;

  const ALLOWED_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ];

  const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.doc'];
  const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024; // 5MB

  function getFileType(file: File): 'pdf' | 'docx' | 'doc' {
    if (file.type === 'application/pdf') return 'pdf';
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      return 'docx';
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
    $uploadCourseDocumentStore.error = null;
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    dragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      selectFile(files[0]);
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    dragOver = true;
  }

  function handleDragLeave() {
    dragOver = false;
  }

  async function uploadDocument() {
    if (!selectedFile) return;

    $uploadCourseDocumentStore.isUploading = true;
    $uploadCourseDocumentStore.uploadProgress = 0;
    $uploadCourseDocumentStore.error = null;

    try {
      // Get presigned URL for upload
      const uploadPresignResponse = await apiClient.post('/course/presign/document/upload', {
        fileName: selectedFile.name,
        fileType: selectedFile.type
      });

      const presignedUrl = uploadPresignResponse.data.url;

      // Upload file to Cloudflare R2 using presigned URL
      const uploadResponse = await axios.put(presignedUrl, selectedFile, {
        headers: {
          'Content-Type': selectedFile.type
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          $uploadCourseDocumentStore.uploadProgress = progress;
        }
      });

      // Get download URL for the uploaded file
      const downloadPresignedResponse = await apiClient.post('/course/presign/download', {
        keys: [uploadPresignResponse.data.fileKey]
      });

      if (!downloadPresignedResponse.data.success) {
        throw new Error(downloadPresignedResponse.data.message);
      }

      const fileKey = uploadPresignResponse.data.fileKey;
      const presignedUrls = downloadPresignedResponse.data.urls;

      // Create document object
      const document = {
        type: getFileType(selectedFile),
        name: selectedFile.name,
        link: presignedUrls[fileKey],
        key: fileKey,
        size: selectedFile.size
      };

      // Add to lesson materials
      $lesson.materials.documents = [...$lesson.materials.documents, document];

      // Update store
      $uploadCourseDocumentStore.uploadedDocument = document;
      $uploadCourseDocumentStore.uploadProgress = 100;

      snackbar.success($t('course.navItem.lessons.materials.tabs.document.upload_success'));

      // Reset after a short delay
      setTimeout(() => {
        resetDocumentUploadStore();
        selectedFile = null;
        if (fileInput) fileInput.value = '';
      }, 1500);
    } catch (error) {
      console.error('Upload error:', error);
      $uploadCourseDocumentStore.error = error instanceof Error ? error.message : 'Upload failed';
      snackbar.error($t('course.navItem.lessons.materials.tabs.document.upload_error'));
    } finally {
      $uploadCourseDocumentStore.isUploading = false;
    }
  }

  function removeSelectedFile() {
    selectedFile = null;
    if (fileInput) fileInput.value = '';
    $uploadCourseDocumentStore.error = null;
  }

  function getFileIcon(type: string) {
    switch (type) {
      case 'application/pdf':
        return PdfIcon;
      default:
        return DocumentIcon;
    }
  }
</script>

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
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center transition-colors {dragOver
      ? 'border-blue-500 bg-blue-50'
      : 'hover:border-gray-400'}"
    on:drop={handleDrop}
    on:dragover={handleDragOver}
    on:dragleave={handleDragLeave}
  >
    {#if selectedFile}
      <div class="mb-4 flex items-center justify-center space-x-3">
        <svelte:component this={getFileIcon(selectedFile.type)} size={32} class="text-blue-600" />
        <div class="text-left">
          <p class="font-medium text-gray-900">{selectedFile.name}</p>
          <p class="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
        </div>
        <button on:click={removeSelectedFile} class="rounded-full p-1 hover:bg-gray-200">
          <CloseIcon size={20} class="text-gray-500" />
        </button>
      </div>
    {:else}
      <DocumentIcon size={32} class="mx-auto mb-4 text-gray-400" />
      <p class="mb-2 text-gray-600">
        {$t('course.navItem.lessons.materials.tabs.document.drag_drop')}
      </p>
      <p class="mb-4 text-sm text-gray-500">
        {$t('course.navItem.lessons.materials.tabs.document.or')}
      </p>
      <input
        bind:this={fileInput}
        type="file"
        accept=".pdf,.docx,.doc"
        on:change={handleFileSelect}
        class="hidden"
      />
      <PrimaryButton
        label={$t('course.navItem.lessons.materials.tabs.document.choose_file')}
        variant={VARIANTS.OUTLINED}
        onClick={() => fileInput?.click()}
      />
    {/if}
  </div>

  <!-- Error Message -->
  {#if $uploadCourseDocumentStore.error}
    <div class="mt-4 rounded-md border border-red-200 bg-red-50 p-3">
      <p class="text-sm text-red-600">{$uploadCourseDocumentStore.error}</p>
    </div>
  {/if}

  <!-- Upload Progress -->
  {#if $uploadCourseDocumentStore.isUploading}
    <div class="mt-4">
      <div class="mb-1 flex justify-between text-sm text-gray-600">
        <span>{$t('course.navItem.lessons.materials.tabs.document.uploading')}</span>
        <span>{$uploadCourseDocumentStore.uploadProgress}%</span>
      </div>
      <div class="h-2 w-full rounded-full bg-gray-200">
        <div
          class="h-2 rounded-full bg-blue-600 transition-all duration-300"
          style="width: {$uploadCourseDocumentStore.uploadProgress}%"
        ></div>
      </div>
    </div>
  {/if}

  <!-- Upload Button -->
  {#if selectedFile && !$uploadCourseDocumentStore.isUploading}
    <div class="mt-6 flex justify-end space-x-3">
      <PrimaryButton
        label={$t('course.navItem.lessons.materials.tabs.document.cancel')}
        variant={VARIANTS.OUTLINED}
        onClick={removeSelectedFile}
      />
      <PrimaryButton
        label={$t('course.navItem.lessons.materials.tabs.document.upload_document')}
        onClick={uploadDocument}
        isLoading={$uploadCourseDocumentStore.isUploading}
      />
    </div>
  {/if}

  <!-- Success Message -->
  {#if $uploadCourseDocumentStore.uploadedDocument}
    <div class="mt-4 rounded-md border border-green-200 bg-green-50 p-3">
      <p class="text-sm text-green-600">
        {$t('course.navItem.lessons.materials.tabs.document.upload_success')}
      </p>
    </div>
  {/if}
</div>
