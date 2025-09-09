<script lang="ts">
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { t } from '$lib/utils/functions/translations';
  import MODES from '$lib/utils/constants/mode';
  import DocumentIcon from 'carbon-icons-svelte/lib/Document.svelte';
  import PdfIcon from 'carbon-icons-svelte/lib/Pdf.svelte';
  import EyeIcon from 'carbon-icons-svelte/lib/View.svelte';
  import isEmpty from 'lodash/isEmpty';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let mode = MODES.view;
  export let displayDocuments: any[] = [];
  export let downloadingDocuments: Set<string>;
  export let formatFileSize: (bytes: number) => string;
  export let openDocumentUploadModal: () => void;
  export let deleteDocument: (index: number) => void;
  export let downloadDocument: (doc: any) => Promise<void>;

  function getFileIcon(type: string) {
    switch (type) {
      case 'pdf':
        return PdfIcon;
      default:
        return DocumentIcon;
    }
  }

  function handleViewPDF(document: any) {
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
          <div class="flex items-start space-x-3">
            <svelte:component
              this={getFileIcon(document.type)}
              size={24}
              class="mt-1 text-blue-600"
            />
            <div class="flex-1">
              <h4 class="mb-2 font-medium text-gray-900">{document.name}</h4>
              <div class="mb-3 flex items-center space-x-4 text-sm text-gray-600">
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
                  <button
                    on:click={() => handleViewPDF(document)}
                    class="text-sm text-blue-600 underline hover:text-blue-800"
                  >
                    <EyeIcon size={16} class="mr-1 inline" />
                    View PDF
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
                  Delete
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
                <button
                  on:click={() => handleViewPDF(document)}
                  class="text-sm text-blue-600 underline hover:text-blue-800"
                >
                  <EyeIcon size={16} class="mr-1 inline" />
                  View PDF
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
            </div>
          </div>
        </div>
      </div>
    {/each}
  </div>
{/if}
