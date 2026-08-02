<script lang="ts">
  import PaperclipIcon from '@lucide/svelte/icons/paperclip';
  import { dragHandleZone } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';
  import { cn } from '../../tools';
  import AttachmentListRow from './attachment-list-row.svelte';
  import type { AttachmentListFile, AttachmentListLabels, AttachmentListMode } from './types';

  const defaultLabels: AttachmentListLabels = {
    title: 'Attachments',
    fileCount: '',
    view: 'View file',
    download: 'Download file',
    delete: 'Delete file',
    reorder: 'Reorder file'
  };

  const flipDurationMs = 150;

  interface Props {
    mode: AttachmentListMode;
    files: AttachmentListFile[];
    labels: AttachmentListLabels;
    formatSize?: (bytes: number) => string;
    onView?: (file: AttachmentListFile) => void;
    onDownload?: (file: AttachmentListFile) => void | Promise<void>;
    onDelete?: (file: AttachmentListFile) => void;
    onReorder?: (files: AttachmentListFile[]) => void;
    class?: string;
  }

  let {
    mode = 'view',
    files = [],
    labels = defaultLabels,
    formatSize,
    onView,
    onDownload,
    onDelete,
    onReorder,
    class: className = ''
  }: Props = $props();

  function getFilesSignature(nextFiles: AttachmentListFile[] = []): string {
    return JSON.stringify(
      nextFiles.map((file) => ({
        id: file.id,
        name: file.name,
        size: file.size,
        type: file.type
      }))
    );
  }

  let orderedFiles = $state<AttachmentListFile[]>([]);
  let lastSyncedSignature = $state('');

  function syncOrderedFiles(nextFiles: AttachmentListFile[] = []) {
    const signature = getFilesSignature(nextFiles);

    if (signature === lastSyncedSignature && orderedFiles.length > 0) return;

    orderedFiles = nextFiles;
    lastSyncedSignature = signature;
  }

  function handleDndConsider(event: CustomEvent<{ items: AttachmentListFile[] }>) {
    orderedFiles = event.detail.items;
  }

  function handleDndFinalize(event: CustomEvent<{ items: AttachmentListFile[] }>) {
    orderedFiles = event.detail.items;
    lastSyncedSignature = getFilesSignature(orderedFiles);
    onReorder?.(orderedFiles);
  }

  const displayFiles = $derived(mode === 'edit' ? (orderedFiles.length > 0 ? orderedFiles : files) : files);
  const isReorderable = $derived(mode === 'edit' && Boolean(onReorder));
  const reorderItems = $derived(orderedFiles.length > 0 ? orderedFiles : files);

  $effect(() => {
    syncOrderedFiles(files);
  });
</script>

<div
  data-slot="attachment-list"
  class={cn('ui:flex ui:w-full ui:flex-col ui:overflow-hidden ui:rounded-md ui:border ui:border-border', className)}
>
  {#if mode === 'view'}
    <div class="ui:flex ui:items-center ui:justify-between ui:border-b ui:border-border ui:p-2">
      <div class="ui:flex ui:items-center ui:gap-2">
        <PaperclipIcon class="ui:text-muted-foreground ui:size-3.5" aria-hidden="true" />
        <h3 class="ui:text-xs">{labels.title}</h3>
      </div>
      <span class="ui:text-muted-foreground ui:text-xs">{labels.fileCount}</span>
    </div>
  {/if}

  {#if isReorderable}
    <section
      class="ui:flex ui:flex-col"
      use:dragHandleZone={{
        items: reorderItems,
        flipDurationMs,
        dropTargetStyle: {
          border: '2px var(--ring) solid',
          'border-style': 'dashed',
          'border-radius': '0.375rem'
        }
      }}
      onconsider={handleDndConsider}
      onfinalize={handleDndFinalize}
    >
      {#each displayFiles as file (file.id)}
        <div animate:flip={{ duration: flipDurationMs }}>
          <AttachmentListRow
            {file}
            {mode}
            {labels}
            showDragHandle={true}
            {formatSize}
            {onView}
            {onDownload}
            {onDelete}
          />
        </div>
      {/each}
    </section>
  {:else}
    <div role="list" class="ui:flex ui:flex-col">
      {#each displayFiles as file (file.id)}
        <div role="listitem">
          <AttachmentListRow
            {file}
            {mode}
            {labels}
            showDragHandle={false}
            {formatSize}
            {onView}
            {onDownload}
            {onDelete}
          />
        </div>
      {/each}
    </div>
  {/if}
</div>
