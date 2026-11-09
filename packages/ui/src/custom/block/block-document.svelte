<script lang="ts">
  import DownloadIcon from '@lucide/svelte/icons/download';
  import FileTextIcon from '@lucide/svelte/icons/file-text';
  import { Button } from '../../base/button';
  import { cn } from '../../tools';
  import { formatFileSize, getFileExtension, getFileTypeStyle, type AttachmentListFile } from '../attachment-list';
  import ChangeButton from './block-change-button.svelte';
  import type { BlockDocumentLabels } from './types';

  const defaultLabels: BlockDocumentLabels = {
    view: 'View file',
    download: 'Download file'
  };

  interface Props {
    file: AttachmentListFile;
    editable?: boolean;
    changeLabel?: string;
    labels?: BlockDocumentLabels;
    onView?: (file: AttachmentListFile) => void;
    onDownload?: (file: AttachmentListFile) => void | Promise<void>;
    onChange?: () => void;
  }

  let { file, editable = false, changeLabel, labels = defaultLabels, onView, onDownload, onChange }: Props = $props();

  let isDownloading = $state(false);

  const fileTypeStyle = $derived(getFileTypeStyle(file.type ?? file.name));
  const extensionLabel = $derived((getFileExtension(file.type ?? '') || getFileExtension(file.name)).toUpperCase());
  const sizeLabel = $derived(file.size != null ? formatFileSize(file.size) : '');
  const metaLine = $derived([extensionLabel, sizeLabel].filter(Boolean).join(' · '));
  const showChange = $derived(editable && !!changeLabel && !!onChange);
  const showDownload = $derived(!editable && !!onDownload);

  async function handleDownload() {
    if (!onDownload) return;

    isDownloading = true;

    try {
      await onDownload(file);
    } finally {
      isDownloading = false;
    }
  }
</script>

<div
  data-slot="document-block"
  class="ui:group/document ui:border-border ui:bg-card ui:relative ui:flex ui:w-full ui:items-center ui:gap-3.5 ui:rounded-xl ui:border ui:px-3.5 ui:py-3 ui:transition-colors ui:hover:border-foreground/20"
>
  <div
    class={cn(
      'ui:relative ui:flex ui:h-13 ui:w-11 ui:shrink-0 ui:flex-col ui:items-center ui:justify-center ui:gap-0.5 ui:rounded-lg',
      fileTypeStyle.backgroundClass,
      fileTypeStyle.iconClass
    )}
    aria-hidden="true"
  >
    <FileTextIcon class="ui:size-4.5" />
    {#if extensionLabel}
      <span class="ui:text-[10px] ui:leading-none ui:font-bold ui:tracking-wide">{extensionLabel}</span>
    {/if}
  </div>

  <div class="ui:min-w-0 ui:flex-1">
    {#if onView}
      <button
        type="button"
        class="ui:focus-visible:ring-ring ui:block ui:max-w-full ui:cursor-pointer ui:truncate ui:rounded-sm ui:text-left ui:text-sm ui:font-semibold ui:after:absolute ui:after:inset-0 ui:after:rounded-xl ui:after:content-[''] ui:focus-visible:ring-2 ui:focus-visible:outline-none"
        aria-label={`${labels.view}: ${file.name}`}
        title={file.name}
        onclick={() => onView(file)}
      >
        {file.name}
      </button>
    {:else}
      <p class="ui:truncate ui:text-sm ui:font-semibold" title={file.name}>{file.name}</p>
    {/if}
    {#if metaLine}
      <p class="ui:text-muted-foreground ui:mt-0.5 ui:text-xs">{metaLine}</p>
    {/if}
  </div>

  {#if showDownload}
    <Button
      type="button"
      variant="outline"
      size="sm"
      class="ui:relative ui:z-10"
      loading={isDownloading}
      onclick={handleDownload}
    >
      <DownloadIcon />
      {labels.download}
    </Button>
  {/if}

  {#if showChange && changeLabel && onChange}
    <div
      class="ui:relative ui:z-10 ui:shrink-0 ui:opacity-100 ui:transition ui:focus-within:opacity-100 ui:sm:opacity-0 ui:sm:group-hover/document:opacity-100"
    >
      <ChangeButton label={changeLabel} onclick={onChange} />
    </div>
  {/if}
</div>
