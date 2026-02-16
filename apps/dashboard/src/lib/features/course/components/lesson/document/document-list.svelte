<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { Empty } from '@cio/ui/custom/empty';
  import { t } from '$lib/utils/functions/translations';
  import MODES from '$lib/utils/constants/mode';
  import isEmpty from 'lodash/isEmpty';
  import FileTextIcon from '@lucide/svelte/icons/file-text';
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
{/if}

{#if !isEmpty(displayDocuments)}
  {@const isEditMode = mode === MODES.edit}
  <Item.Group class="flex w-full gap-4">
    {#each displayDocuments as document, index}
      <DocumentCard
        {document}
        {index}
        {isEditMode}
        isDownloading={downloadingDocuments.has(document.name)}
        {formatFileSize}
        onRemove={() => (isEditMode ? requestRemoveDocument(index) : undefined)}
        {onViewPDF}
        onDownload={downloadDocument}
      />
    {/each}
  </Item.Group>
{:else if mode === MODES.edit}
  <Empty
    title={$t('course.navItem.lessons.materials.tabs.document.empty_title')}
    description={$t('course.navItem.lessons.materials.tabs.document.empty_description')}
    icon={FileTextIcon}
  />
{/if}
