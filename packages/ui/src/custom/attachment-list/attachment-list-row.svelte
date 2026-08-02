<script lang="ts">
  import FileTextIcon from '@lucide/svelte/icons/file-text';
  import EyeIcon from '@lucide/svelte/icons/eye';
  import DownloadIcon from '@lucide/svelte/icons/download';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import GripVerticalIcon from '@lucide/svelte/icons/grip-vertical';
  import { dragHandle } from 'svelte-dnd-action';
  import { Button } from '../../base/button';
  import { cn } from '../../tools';
  import { formatFileSize } from './format-file-size';
  import { getFileTypeStyle } from './file-type-style';
  import type { AttachmentListFile, AttachmentListLabels, AttachmentListMode } from './types';

  interface Props {
    file: AttachmentListFile;
    mode: AttachmentListMode;
    labels: AttachmentListLabels;
    showDragHandle?: boolean;
    formatSize?: (bytes: number) => string;
    onView?: (file: AttachmentListFile) => void;
    onDownload?: (file: AttachmentListFile) => void;
    onDelete?: (file: AttachmentListFile) => void;
    class?: string;
  }

  let {
    file,
    mode,
    labels,
    showDragHandle = false,
    formatSize = formatFileSize,
    onView,
    onDownload,
    onDelete,
    class: className = ''
  }: Props = $props();

  const fileTypeStyle = $derived(getFileTypeStyle(file.type ?? file.name));
  const sizeLabel = $derived(file.size != null ? formatSize(file.size) : null);
</script>

<div
  class={cn(
    'ui:flex ui:items-center ui:gap-3 ui:border-b ui:border-border ui:px-4 ui:py-3 ui:last:border-b-0',
    className
  )}
>
  {#if showDragHandle}
    <div
      use:dragHandle
      class="ui:text-muted-foreground ui:flex ui:shrink-0 ui:cursor-grab ui:items-center ui:active:cursor-grabbing"
      aria-label={labels.reorder}
    >
      <GripVerticalIcon class="ui:size-4" aria-hidden="true" />
    </div>
  {/if}

  <div
    class={cn(
      'ui:flex ui:size-9 ui:shrink-0 ui:items-center ui:justify-center ui:rounded-md',
      fileTypeStyle.backgroundClass
    )}
    aria-hidden="true"
  >
    <FileTextIcon class={cn('ui:size-4', fileTypeStyle.iconClass)} />
  </div>

  <div class="ui:min-w-0 ui:flex-1">
    <p class="ui:truncate ui:text-sm ui:font-semibold">{file.name}</p>
    {#if sizeLabel}
      <p class="ui:text-muted-foreground ui:mt-0.5 ui:text-xs">{sizeLabel}</p>
    {/if}
  </div>

  <div class="ui:flex ui:shrink-0 ui:items-center ui:gap-1.5">
    {#if onView}
      <Button type="button" variant="outline" size="icon-sm" aria-label={labels.view} onclick={() => onView(file)}>
        <EyeIcon class="ui:size-4" />
      </Button>
    {/if}

    {#if mode === 'view' && onDownload}
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label={labels.download}
        onclick={() => onDownload(file)}
      >
        <DownloadIcon class="ui:size-4" />
      </Button>
    {:else if mode === 'edit' && onDelete}
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        class="ui:text-destructive ui:hover:text-destructive"
        aria-label={labels.delete}
        onclick={() => onDelete(file)}
      >
        <Trash2Icon class="ui:size-4" />
      </Button>
    {/if}
  </div>
</div>
