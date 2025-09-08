<script lang="ts">
  import {
    lesson,
    deleteLessonDocument
  } from '$lib/components/Course/components/Lesson/store/lessons';
  import { uploadCourseDocumentStore } from '$lib/components/Course/components/Lesson/store/lessons';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { t } from '$lib/utils/functions/translations';
  import MODES from '$lib/utils/constants/mode';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import TrashCanIcon from 'carbon-icons-svelte/lib/TrashCan.svelte';
  import DocumentIcon from 'carbon-icons-svelte/lib/Document.svelte';
  import PdfIcon from 'carbon-icons-svelte/lib/Pdf.svelte';
  import isEmpty from 'lodash/isEmpty';

  export let mode = MODES.view;

  function openDocumentUploadModal() {
    $uploadCourseDocumentStore.isModalOpen = true;
  }

  function deleteDocument(index: number) {
    deleteLessonDocument(index);
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function getFileIcon(type: string) {
    switch (type) {
      case 'pdf':
        return PdfIcon;
      default:
        return DocumentIcon;
    }
  }
</script>

<div class="w-full">
  {#if mode === MODES.edit}
    <div class="mb-4">
      <PrimaryButton label="Add Document" onClick={openDocumentUploadModal} className="mb-4" />
    </div>

    {#if !isEmpty($lesson.materials.documents)}
      <div class="space-y-4">
        {#each $lesson.materials.documents as document, index}
          <div class="rounded-lg border border-gray-200 p-4">
            <div class="flex items-start space-x-3">
              <svelte:component
                this={getFileIcon(document.type)}
                size={24}
                class="mt-1 text-blue-600"
              />
              <div class="flex-1">
                <div class="mb-2 flex items-center justify-between">
                  <h4 class="font-medium text-gray-900">{document.name}</h4>
                  <IconButton onClick={() => deleteDocument(index)}>
                    <TrashCanIcon size={20} class="carbon-icon dark:text-white" />
                  </IconButton>
                </div>
                <div class="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Type: {document.type.toUpperCase()}</span>
                  {#if document.size}
                    <span>Size: {formatFileSize(document.size)}</span>
                  {/if}
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  {:else if !isEmpty($lesson.materials.documents)}
    <div class="space-y-4">
      {#each $lesson.materials.documents as document}
        <div class="rounded-lg border border-gray-200 p-4">
          <div class="flex items-start space-x-3">
            <svelte:component
              this={getFileIcon(document.type)}
              size={24}
              class="mt-1 text-blue-600"
            />
            <div class="flex-1">
              <h4 class="mb-2 font-medium text-gray-900">{document.name}</h4>
              <div class="mb-3 flex items-center space-x-4 text-sm text-gray-600">
                <span>Type: {document.type.toUpperCase()}</span>
                {#if document.size}
                  <span>Size: {formatFileSize(document.size)}</span>
                {/if}
              </div>
              <div class="flex gap-3">
                <a
                  href={document.link}
                  target="_blank"
                  class="text-sm text-blue-600 underline hover:text-blue-800"
                >
                  View Document
                </a>
                <a
                  href={document.link}
                  download={document.name}
                  class="text-sm text-green-600 underline hover:text-green-800"
                >
                  Download
                </a>
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="py-8 text-center">
      <DocumentIcon size={32} class="mx-auto mb-4 text-gray-400" />
      <p class="text-gray-500">No documents uploaded yet</p>
    </div>
  {/if}
</div>
