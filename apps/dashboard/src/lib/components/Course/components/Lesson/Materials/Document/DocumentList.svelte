<script lang="ts">
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { t } from '$lib/utils/functions/translations';
  import MODES from '$lib/utils/constants/mode';
  import DocumentIcon from 'carbon-icons-svelte/lib/Document.svelte';
  import PdfIcon from 'carbon-icons-svelte/lib/Pdf.svelte';
  import EyeIcon from 'carbon-icons-svelte/lib/View.svelte';
  import isEmpty from 'lodash/isEmpty';
  import { createEventDispatcher } from 'svelte';
  import type { LessonDocument } from '$lib/utils/types';

  const dispatch = createEventDispatcher();

  export let mode = MODES.view;
  export let displayDocuments: LessonDocument[] = [];
  export let downloadingDocuments: Set<string>;
  export let formatFileSize: (bytes: number) => string;
  export let openDocumentUploadModal: () => void;
  export let deleteDocument: (index: number) => void;
  export let downloadDocument: (doc: LessonDocument) => Promise<void>;
  export let isLoading = false;

  function getFileIcon(type: string) {
    switch (type) {
      case 'pdf':
        return PdfIcon;
      default:
        return DocumentIcon;
    }
  }

  function handleViewPDF(document: LessonDocument) {
    dispatch('viewPDF', document);
  }
</script>

{#if mode === MODES.edit}
  <div class="mb-4">
    <PrimaryButton
      label={$t('course.navItem.lessons.materials.tabs.document.add_document')}
      onClick={openDocumentUploadModal}
      className="mb-4"
    />
  </div>

  {#if !isEmpty(displayDocuments)}
    <div class="space-y-4">
      {#each displayDocuments as document, index}
        <div class="rounded-lg border border-gray-200 p-4">
          <div class="flex items-center space-x-3">
            <svelte:component
              this={getFileIcon(document.type)}
              size={32}
              class="text-primary-600 w-[10%]"
            />
            <div class="flex-1">
              <h4 class="mb-2 font-medium text-gray-900 dark:text-gray-300">{document.name}</h4>
              <div
                class="mb-3 flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400"
              >
                <span>
                  {$t('course.navItem.lessons.materials.tabs.document.type')}: {document.type.toUpperCase()}
                </span>
                {#if document.size}
                  <span>
                    {$t('course.navItem.lessons.materials.tabs.document.size')}: {formatFileSize(
                      document.size
                    )}
                  </span>
                {/if}
              </div>
              <div class="flex gap-3">
                {#if document.type === 'pdf'}
                  <button
                    on:click={() => handleViewPDF(document)}
                    class="text-sm text-blue-600 underline hover:text-blue-800"
                  >
                    <EyeIcon size={16} class="mr-1 inline" />
                    {$t('course.navItem.lessons.materials.tabs.document.view_pdf')}
                  </button>
                {:else}
                  <a
                    href={document.link}
                    target="_blank"
                    class="text-sm text-blue-600 underline hover:text-blue-800"
                  >
                    {$t('course.navItem.lessons.materials.tabs.document.view_document')}
                  </a>
                {/if}
                <button
                  on:click={() => downloadDocument(document)}
                  disabled={downloadingDocuments.has(document.name)}
                  class="cursor-pointer text-sm text-green-600 underline hover:text-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {downloadingDocuments.has(document.name)
                    ? $t('course.navItem.lessons.materials.tabs.document.downloading')
                    : $t('course.navItem.lessons.materials.tabs.document.download')}
                </button>
                <button
                  on:click={() => deleteDocument(index)}
                  class="text-sm text-red-600 underline hover:text-red-800"
                >
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
      <div class="rounded-md border border-gray-200 p-4 dark:border-neutral-600">
        <div class="flex items-center space-x-3">
          <svelte:component
            this={getFileIcon(document.type)}
            size={32}
            class="text-primary-600 w-[10%]"
          />
          <div class="flex-1">
            <h4 class="mb-2 font-medium text-gray-900 dark:text-gray-300">{document.name}</h4>
            <div class="mb-3 flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <span
                >{$t('course.navItem.lessons.materials.tabs.document.type')}: {document.type.toUpperCase()}</span
              >
              {#if document.size}
                <span
                  >{$t('course.navItem.lessons.materials.tabs.document.size')}: {formatFileSize(
                    document.size
                  )}</span
                >
              {/if}
            </div>
            <div class="flex gap-3">
              {#if document.type === 'pdf'}
                <PrimaryButton
                  variant={VARIANTS.CONTAINED_DARK}
                  onClick={() => handleViewPDF(document)}
                  {isLoading}
                >
                  <EyeIcon size={16} class="mr-1 inline" />
                  {$t('course.navItem.lessons.materials.tabs.document.view_pdf')}
                </PrimaryButton>
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
