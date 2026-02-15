<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { t } from '$lib/utils/functions/translations';
  import MODES from '$lib/utils/constants/mode';
  import isEmpty from 'lodash/isEmpty';
  import * as Item from '@cio/ui/base/item';
  import DocumentCard from './document-card.svelte';
  import type { LessonDocument } from '$features/course/utils/types';

  interface Props {
    mode?: (typeof MODES)[keyof typeof MODES];
    displayDocuments?: LessonDocument[];
    downloadingDocuments: Set<string>;
    formatFileSize: (bytes: number) => string;
    openDocumentUploadModal: () => void;
    requestRemoveDocument: (index: number) => void;
    onViewPDF: (doc: LessonDocument) => void;
    downloadDocument: (doc: LessonDocument) => Promise<void>;
  }

  let {
    mode = MODES.view,
    displayDocuments = [],
    downloadingDocuments,
    formatFileSize,
    openDocumentUploadModal,
    requestRemoveDocument,
    onViewPDF,
    downloadDocument
  }: Props = $props();
</script>

{#if mode === MODES.edit}
  <div class="flex justify-end">
    <Button onclick={openDocumentUploadModal} class="my-4!">
      {$t('course.navItem.lessons.materials.tabs.document.add_document')}
    </Button>
  </div>

  {#if !isEmpty(displayDocuments)}
    <Item.Group class="grid! w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {#each displayDocuments as document, index}
        <DocumentCard
          {document}
          {index}
          isEditMode={true}
          isDownloading={downloadingDocuments.has(document.name)}
          {formatFileSize}
          onRemove={() => requestRemoveDocument(index)}
          {onViewPDF}
          onDownload={downloadDocument}
        />
      {/each}
    </Item.Group>
  {/if}
{:else if !isEmpty(displayDocuments)}
  <Item.Group class="grid! w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
    {#each displayDocuments as document, index}
      <DocumentCard
        {document}
        {index}
        isEditMode={false}
        isDownloading={downloadingDocuments.has(document.name)}
        {formatFileSize}
        onRemove={() => {}}
        {onViewPDF}
        onDownload={downloadDocument}
      />
    {/each}
  </Item.Group>
{/if}
