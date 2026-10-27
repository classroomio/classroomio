<script lang="ts">
  import { slide } from 'svelte/transition';
  import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
  import { Button } from '@cio/ui/base/button';
  import { CloseButton } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';
  import { formatUploadFileSize, getFileBadge, getUploadedBytes } from '$features/course/utils/document-upload-utils';
  import type { DocumentUploadItem } from '$features/course/utils/types';

  interface Props {
    item: DocumentUploadItem;
    onRemove: (id: string) => void;
    onRetry: (id: string) => void;
  }

  let { item, onRemove, onRetry }: Props = $props();

  const keyPrefix = 'course.navItem.lessons.materials.tabs.document';

  let badge = $derived(getFileBadge(item.file.name));
  let isInFlight = $derived(item.status === 'queued' || item.status === 'uploading');
  let totalSize = $derived(formatUploadFileSize(item.file.size));
  let uploadedSize = $derived(formatUploadFileSize(getUploadedBytes(item)));
</script>

<div class="ui:border-border relative overflow-hidden rounded-lg border" transition:slide={{ duration: 150 }}>
  <div
    class="ui:to-primary/20 pointer-events-none absolute inset-y-0 left-0 bg-gradient-to-r from-transparent transition-[width,opacity] duration-300 ease-out {item.status ===
    'done'
      ? 'opacity-0'
      : ''}"
    style="width: {item.progress}%"
  ></div>

  <div class="relative flex items-center gap-3 px-3 py-2">
    <span
      class="flex size-8 shrink-0 items-center justify-center rounded-md text-[9px] font-bold text-white {badge.colorClass}"
    >
      {badge.label}
    </span>

    <div class="min-w-0 flex-1">
      <p class="truncate text-sm leading-tight font-medium" title={item.file.name}>{item.file.name}</p>

      <p class="mt-0.5 flex items-center gap-1 text-xs leading-tight">
        {#if item.status === 'done'}
          <CircleCheckIcon class="size-3.5 shrink-0 text-green-600" />
          <span class="font-medium text-green-600">{$t(`${keyPrefix}.completed`)}</span>
          <span class="ui:text-muted-foreground">· {totalSize}</span>
        {:else if item.status === 'error'}
          <span class="font-medium text-red-600">{$t(`${keyPrefix}.failed`)}</span>
          <span class="ui:text-muted-foreground">· {totalSize}</span>
        {:else}
          <span class="ui:text-primary font-medium"
            >{$t(`${keyPrefix}.uploading_progress`, { percent: item.progress })}</span
          >
          <span class="ui:text-muted-foreground">
            · {$t(`${keyPrefix}.size_progress`, { uploaded: uploadedSize, total: totalSize })}
          </span>
        {/if}
      </p>
    </div>

    {#if item.status === 'error'}
      <Button size="xs" variant="secondary" onclick={() => onRetry(item.id)}>{$t(`${keyPrefix}.try_again`)}</Button>
    {/if}

    {#if item.status !== 'done'}
      <CloseButton tooltip={$t(`${keyPrefix}.remove_document`)} onClick={() => onRemove(item.id)} />
    {/if}
  </div>

  {#if isInFlight}
    <div
      class="ui:bg-primary absolute bottom-0 left-0 h-0.5 transition-[width] duration-300 ease-out"
      style="width: {item.progress}%"
    ></div>
  {/if}
</div>
