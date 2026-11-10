<script lang="ts">
  import { fly } from 'svelte/transition';
  import { Button } from '@cio/ui/base/button';
  import { Progress } from '@cio/ui/base/progress';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
  import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
  import Maximize2Icon from '@lucide/svelte/icons/maximize-2';
  import UploadIcon from '@lucide/svelte/icons/upload';
  import XIcon from '@lucide/svelte/icons/x';

  import { mediaUploadManager } from '$features/media/api';
  import { t } from '$lib/utils/functions/translations';

  import MediaUploadList from './media-upload-list.svelte';

  const total = $derived(mediaUploadManager.items.length);
  const title = $derived.by(() => {
    if (mediaUploadManager.isUploading) {
      return $t('media_manager.upload.summary.uploading', { done: mediaUploadManager.doneCount, total });
    }

    if (mediaUploadManager.failedCount > 0) {
      return $t('media_manager.upload.summary.failed', { count: mediaUploadManager.failedCount, total });
    }

    return $t('media_manager.upload.summary.completed', { count: total });
  });
  const toggleLabel = $derived(
    mediaUploadManager.isTrayExpanded ? $t('media_manager.upload.collapse') : $t('media_manager.upload.expand')
  );
</script>

<section
  class="ui:bg-background ui:border-border ui:z-app-bar-elevated fixed right-4 bottom-4 flex w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-lg border shadow-lg"
  aria-label={$t('media_manager.upload.dialog_title')}
  data-testid="media-upload-tray"
  transition:fly={{ y: 24, duration: 200 }}
>
  <header class="flex items-center gap-2 px-3 py-2.5">
    {#if mediaUploadManager.isUploading}
      <UploadIcon class="ui:text-primary size-4 shrink-0" />
    {:else if mediaUploadManager.failedCount > 0}
      <CircleAlertIcon class="ui:text-destructive size-4 shrink-0" />
    {:else}
      <CircleCheckIcon class="size-4 shrink-0 text-green-600" />
    {/if}

    <p class="min-w-0 flex-1 truncate text-sm font-medium" aria-live="polite" data-testid="media-upload-tray-title">
      {title}
    </p>

    {#if mediaUploadManager.isUploading}
      <span class="ui:text-muted-foreground text-xs tabular-nums">{mediaUploadManager.overallProgress}%</span>
    {/if}

    <Button
      variant="secondary"
      size="icon-xs"
      aria-label={toggleLabel}
      title={toggleLabel}
      aria-expanded={mediaUploadManager.isTrayExpanded}
      testId="media-upload-tray-toggle"
      onclick={() => mediaUploadManager.toggleTray()}
    >
      <ChevronDownIcon
        class="transition-transform duration-200 {mediaUploadManager.isTrayExpanded ? '' : 'rotate-180'}"
      />
    </Button>
    <Button
      variant="secondary"
      size="icon-xs"
      aria-label={$t('media_manager.upload.maximize')}
      title={$t('media_manager.upload.maximize')}
      testId="media-upload-tray-maximize"
      onclick={() => mediaUploadManager.open()}
    >
      <Maximize2Icon />
    </Button>
    {#if !mediaUploadManager.isUploading}
      <Button
        variant="secondary"
        size="icon-xs"
        aria-label={$t('media_manager.upload.close')}
        title={$t('media_manager.upload.close')}
        testId="media-upload-tray-close"
        onclick={() => mediaUploadManager.dismiss()}
      >
        <XIcon />
      </Button>
    {/if}
  </header>

  {#if mediaUploadManager.isUploading}
    <Progress class="h-0.5 rounded-none" value={mediaUploadManager.overallProgress} max={100} />
  {/if}

  {#if mediaUploadManager.isTrayExpanded}
    <MediaUploadList class="max-h-88 border-t p-2" />
  {/if}
</section>
