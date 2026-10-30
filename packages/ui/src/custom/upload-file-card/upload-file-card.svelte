<script lang="ts">
  import { slide } from 'svelte/transition';
  import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
  import XIcon from '@lucide/svelte/icons/x';
  import { Button } from '../../base/button';
  import { cn } from '../../tools';
  import { formatFileSize } from '../attachment-list/format-file-size';
  import FileTypeBadge from './file-type-badge.svelte';
  import type { UploadFileCardLabels, UploadFileCardStatus } from './types';

  interface Props {
    name: string;
    /** File size in bytes. */
    size: number;
    status?: UploadFileCardStatus;
    /** Upload progress from 0 to 100. Drives the fill and the bar while the file is in flight. */
    progress?: number;
    /** Why the upload failed. Shown beside the failed label; falls back to the file size. */
    errorMessage?: string | null;
    labels: UploadFileCardLabels;
    formatSize?: (bytes: number) => string;
    onRemove?: () => void;
    onRetry?: () => void;
    class?: string;
  }

  let {
    name,
    size,
    status = 'uploading',
    progress = 0,
    errorMessage = null,
    labels,
    formatSize = formatFileSize,
    onRemove,
    onRetry,
    class: className = ''
  }: Props = $props();

  const isInFlight = $derived(status === 'queued' || status === 'uploading');
  const clampedProgress = $derived(Math.min(Math.max(progress, 0), 100));
  const totalSize = $derived(formatSize(size));
  const uploadedSize = $derived(formatSize(Math.round((size * clampedProgress) / 100)));
</script>

<div
  class={cn('ui:relative ui:overflow-hidden ui:rounded-lg ui:border ui:border-border', className)}
  transition:slide={{ duration: 150 }}
>
  <div
    class={cn(
      'ui:pointer-events-none ui:absolute ui:inset-y-0 ui:left-0 ui:bg-gradient-to-r ui:from-transparent ui:to-primary/20 ui:transition-[width,opacity] ui:duration-300 ui:ease-out',
      status === 'done' && 'ui:opacity-0'
    )}
    style="width: {clampedProgress}%"
  ></div>

  <div class="ui:relative ui:flex ui:items-center ui:gap-3 ui:px-3 ui:py-2">
    <FileTypeBadge {name} size="sm" />

    <div class="ui:min-w-0 ui:flex-1">
      <p class="ui:truncate ui:text-sm ui:leading-tight ui:font-medium" title={name}>{name}</p>

      <p class="ui:mt-0.5 ui:flex ui:items-center ui:gap-1 ui:text-xs ui:leading-tight">
        {#if status === 'done'}
          <CircleCheckIcon class="ui:size-3.5 ui:shrink-0 ui:text-green-600" />
          <span class="ui:font-medium ui:text-green-600">{labels.completed}</span>
          <span class="ui:text-muted-foreground">· {totalSize}</span>
        {:else if status === 'error'}
          <span class="ui:text-destructive ui:shrink-0 ui:font-medium">{labels.failed}</span>
          <span class="ui:text-muted-foreground ui:truncate" title={errorMessage ?? undefined}>
            · {errorMessage ?? totalSize}
          </span>
        {:else if status === 'queued'}
          <span class="ui:text-muted-foreground ui:font-medium">{labels.queued}</span>
          <span class="ui:text-muted-foreground">· {totalSize}</span>
        {:else}
          <span class="ui:text-primary ui:font-medium">{labels.uploading(clampedProgress)}</span>
          <span class="ui:text-muted-foreground">· {labels.transferred(uploadedSize, totalSize)}</span>
        {/if}
      </p>
    </div>

    {#if status === 'error' && onRetry}
      <Button size="xs" variant="secondary" onclick={onRetry}>{labels.retry}</Button>
    {/if}

    {#if status !== 'done' && onRemove}
      <Button size="icon-xs" variant="secondary" aria-label={labels.remove} title={labels.remove} onclick={onRemove}>
        <XIcon />
      </Button>
    {/if}
  </div>

  {#if isInFlight}
    <div
      class="ui:absolute ui:bottom-0 ui:left-0 ui:h-0.5 ui:bg-primary ui:transition-[width] ui:duration-300 ui:ease-out"
      style="width: {clampedProgress}%"
    ></div>
  {/if}
</div>
