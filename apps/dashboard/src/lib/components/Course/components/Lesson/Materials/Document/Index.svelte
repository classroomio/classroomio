<script lang="ts">
  import { uploadCourseDocumentStore, resetDocumentUploadStore } from './store';
  import { supabase } from '$lib/utils/functions/supabase';
  import { snackbar } from '$lib/components/Snackbar/store';
  import { t } from '$lib/utils/functions/translations';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import DocumentIcon from 'carbon-icons-svelte/lib/Document.svelte';
  import PdfIcon from 'carbon-icons-svelte/lib/Pdf.svelte';
  import CloseIcon from 'carbon-icons-svelte/lib/Close.svelte';
  import { lesson } from '../../store/lessons';

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
  const BUCKET_NAME = 'documents';

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
      return `File type not supported. Please upload PDF, DOCX, or DOC files.`;
    }

    if (file.size > MAX_DOCUMENT_SIZE) {
      return `File size too large. Maximum size is ${formatFileSize(MAX_DOCUMENT_SIZE)}.`;
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
      // Generate unique filename with timestamp
      const timestamp = Date.now();
      const fileExtension = selectedFile.name.split('.').pop();
      const fileName = `${timestamp}-${selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new Error(error.message);
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get document URL');
      }

      // Create document object
      const document = {
        type: getFileType(selectedFile),
        name: selectedFile.name,
        link: urlData.publicUrl,
        key: fileName,
        size: selectedFile.size
      };

      // Add to lesson materials
      $lesson.materials.documents = [...$lesson.materials.documents, document];

      // Update store
      $uploadCourseDocumentStore.uploadedDocument = document;
      $uploadCourseDocumentStore.uploadProgress = 100;

      snackbar.success('Document uploaded successfully!');

      // Reset after a short delay
      setTimeout(() => {
        resetDocumentUploadStore();
        selectedFile = null;
        if (fileInput) fileInput.value = '';
      }, 1500);
    } catch (error) {
      console.error('Upload error:', error);
      $uploadCourseDocumentStore.error = error instanceof Error ? error.message : 'Upload failed';
      snackbar.error('Failed to upload document');
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
    <h3 class="mb-2 text-lg font-semibold">Upload Document</h3>
    <p class="mb-4 text-sm text-gray-600">Upload PDF, DOCX, or DOC files. Maximum size: 5MB</p>
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
      <p class="mb-2 text-gray-600">Drag and drop your document here</p>
      <p class="mb-4 text-sm text-gray-500">or</p>
      <input
        bind:this={fileInput}
        type="file"
        accept=".pdf,.docx,.doc"
        on:change={handleFileSelect}
        class="hidden"
      />
      <PrimaryButton
        label="Choose File"
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
        <span>Uploading...</span>
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
      <PrimaryButton label="Cancel" variant={VARIANTS.OUTLINED} onClick={removeSelectedFile} />
      <PrimaryButton
        label="Upload Document"
        onClick={uploadDocument}
        isLoading={$uploadCourseDocumentStore.isUploading}
      />
    </div>
  {/if}

  <!-- Success Message -->
  {#if $uploadCourseDocumentStore.uploadedDocument}
    <div class="mt-4 rounded-md border border-green-200 bg-green-50 p-3">
      <p class="text-sm text-green-600">
        Document "{$uploadCourseDocumentStore.uploadedDocument.name}" uploaded successfully!
      </p>
    </div>
  {/if}
</div>
