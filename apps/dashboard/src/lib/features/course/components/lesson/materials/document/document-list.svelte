<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { t } from '$lib/utils/functions/translations';
  import MODES from '$lib/utils/constants/mode';
  import FileTextIcon from '@lucide/svelte/icons/file-text';
  import EyeIcon from '@lucide/svelte/icons/eye';
  import isEmpty from 'lodash/isEmpty';
  import { createEventDispatcher } from 'svelte';
  import type { LessonDocument } from '$lib/utils/types';

  const dispatch = createEventDispatcher();

  interface Props {
    mode?: any;
    displayDocuments?: LessonDocument[];
    downloadingDocuments: Set<string>;
    formatFileSize: (bytes: number) => string;
    openDocumentUploadModal: () => void;
    deleteDocument: (index: number) => void;
    downloadDocument: (doc: LessonDocument) => Promise<void>;
    isLoading?: boolean;
  }

  let {
    mode = MODES.view,
    displayDocuments = [],
    downloadingDocuments,
    formatFileSize,
    openDocumentUploadModal,
    deleteDocument,
    downloadDocument,
    isLoading = false
  }: Props = $props();

  function handleViewPDF(document: LessonDocument) {
    dispatch('viewPDF', document);
  }
</script>

{#if mode === MODES.edit}
  <div class="mb-4">
    <Button onclick={openDocumentUploadModal} class="mb-4">
      {$t('course.navItem.lessons.materials.tabs.document.add_document')}
    </Button>
  </div>

  {#if !isEmpty(displayDocuments)}
    <div class="space-y-4">
      {#each displayDocuments as document, index}
        <div class="rounded-lg border border-gray-200 p-4">
          <div class="flex items-center space-x-3">
            <FileTextIcon size={16} />
            <div class="flex-1">
              <h4 class="mb-2 font-medium text-gray-900 dark:text-gray-300">{document.name}</h4>
              <div class="mb-3 flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                <span>
                  {$t('course.navItem.lessons.materials.tabs.document.type')}: {document.type.toUpperCase()}
                </span>
                {#if document.size}
                  <span>
                    {$t('course.navItem.lessons.materials.tabs.document.size')}: {formatFileSize(document.size)}
                  </span>
                {/if}
              </div>
              <div class="flex gap-3">
                {#if document.type === 'pdf'}
                  <button
                    onclick={() => handleViewPDF(document)}
                    class="text-sm text-blue-600 underline hover:text-blue-800"
                  >
                    <EyeIcon size={16} />
                    {$t('course.navItem.lessons.materials.tabs.document.view_pdf')}
                  </button>
                {:else}
                  <a href={document.link} target="_blank" class="text-sm text-blue-600 underline hover:text-blue-800">
                    {$t('course.navItem.lessons.materials.tabs.document.view_document')}
                  </a>
                {/if}
                <button
                  onclick={() => downloadDocument(document)}
                  disabled={downloadingDocuments.has(document.name)}
                  class="cursor-pointer text-sm text-green-600 underline hover:text-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {downloadingDocuments.has(document.name)
                    ? $t('course.navItem.lessons.materials.tabs.document.downloading')
                    : $t('course.navItem.lessons.materials.tabs.document.download')}
                </button>
                <button onclick={() => deleteDocument(index)} class="text-sm text-red-600 underline hover:text-red-800">
                  {$t('course.navItem.lessons.materials.tabs.document.delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
{:else if !isEmpty(displayDocuments)}
  <div class="space-y-4">
    {#each displayDocuments as document}
      <div class="rounded-md border border-gray-200 p-4">
        <div class="flex items-center space-x-3">
          <FileTextIcon size={16} />
          <div class="flex-1">
            <h4 class="mb-2 font-medium text-gray-900 dark:text-gray-300">{document.name}</h4>
            <div class="mb-3 flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <span>{$t('course.navItem.lessons.materials.tabs.document.type')}: {document.type.toUpperCase()}</span>
              {#if document.size}
                <span>{$t('course.navItem.lessons.materials.tabs.document.size')}: {formatFileSize(document.size)}</span
                >
              {/if}
            </div>
            <div class="flex gap-3">
              {#if document.type === 'pdf'}
                <Button onclick={() => handleViewPDF(document)} loading={isLoading}>
                  <EyeIcon size={16} />
                  {$t('course.navItem.lessons.materials.tabs.document.view_pdf')}
                </Button>
              {:else}
                <a
                  href={isLoading ? '#' : document.link}
                  target={isLoading ? null : '_blank'}
                  aria-disabled={isLoading}
                  class="text-sm text-blue-600 underline hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {$t('course.navItem.lessons.materials.tabs.document.view_document')}
                </a>
              {/if}
            </div>
          </div>
        </div>
      </div>
    {/each}
  </div>
{/if}
