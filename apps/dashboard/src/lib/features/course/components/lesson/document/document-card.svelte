<script lang="ts">
  import * as Item from '@cio/ui/base/item';
  import FileTextIcon from '@lucide/svelte/icons/file-text';
  import EyeIcon from '@lucide/svelte/icons/eye';
  import DownloadIcon from '@lucide/svelte/icons/download';
  import { Button } from '@cio/ui/base/button';
  import { t } from '$lib/utils/functions/translations';
  import DocumentCardDropdown from './document-card-dropdown.svelte';
  import type { LessonDocument } from '$features/course/utils/types';

  interface Props {
    document: LessonDocument;
    index: number;
    isEditMode: boolean;
    isDownloading: boolean;
    formatFileSize: (bytes: number) => string;
    onRemove: () => void;
    onViewPDF: (doc: LessonDocument) => void;
    onDownload: (doc: LessonDocument) => Promise<void>;
  }

  let {
    document: doc,
    index: _index,
    isEditMode,
    isDownloading,
    formatFileSize,
    onRemove,
    onViewPDF,
    onDownload
  }: Props = $props();

  const subtitle = $derived(
    [doc.type.toUpperCase(), doc.size != null ? formatFileSize(doc.size) : null].filter(Boolean).join(' · ') || '–'
  );
</script>

<Item.Root variant="outline" class="group relative max-w-[320px] cursor-default! p-3!">
  <div class="flex flex-col">
    {#if isEditMode}
      <DocumentCardDropdown {onRemove} />
    {/if}

    <Item.Header>
      <Item.Media variant="icon" class="ui:!size-14 ui:[&_svg]:!size-8" aria-label={doc.name}>
        <FileTextIcon class="ui:text-muted-foreground" />
      </Item.Media>
    </Item.Header>

    <Item.Content>
      <Item.Title class="line-clamp-2 min-h-[44px] text-base!" title={doc.name}>
        {doc.name}
      </Item.Title>
      <p class="ui:text-muted-foreground mt-1 text-xs">{subtitle}</p>

      <div class="mt-3 flex flex-wrap gap-2">
        {#if doc.type === 'pdf'}
          <Button variant="outline" size="sm" onclick={() => onViewPDF(doc)} class="gap-1.5">
            <EyeIcon size={14} />
            {$t('course.navItem.lessons.materials.tabs.document.view_pdf')}
          </Button>
        {:else}
          <a
            href={doc.link}
            target="_blank"
            rel="noopener noreferrer"
            class="ui:border-input ui:bg-background ui:text-foreground hover:ui:bg-accent hover:ui:text-accent-foreground inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium"
          >
            {$t('course.navItem.lessons.materials.tabs.document.view_document')}
          </a>
        {/if}
        <Button variant="outline" size="sm" onclick={() => onDownload(doc)} disabled={isDownloading} class="gap-1.5">
          <DownloadIcon size={14} />
          {isDownloading
            ? $t('course.navItem.lessons.materials.tabs.document.downloading')
            : $t('course.navItem.lessons.materials.tabs.document.download')}
        </Button>
      </div>
    </Item.Content>
  </div>
</Item.Root>
