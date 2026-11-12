<script lang="ts">
  import { UploadFileCard } from '@cio/ui/custom/upload-file-card';
  import type { UploadFileCardLabels } from '@cio/ui/custom/upload-file-card';

  import { mediaUploadManager } from '$features/media/api';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    class?: string;
  }

  let { class: className = '' }: Props = $props();

  const labels: UploadFileCardLabels = $derived({
    queued: $t('media_manager.upload.status.queued'),
    completed: $t('media_manager.upload.status.completed'),
    failed: $t('media_manager.upload.status.failed'),
    retry: $t('media_manager.upload.status.retry'),
    remove: $t('media_manager.upload.status.remove'),
    uploading: (percent) => $t('media_manager.upload.status.uploading_progress', { percent }),
    transferred: (uploaded, total) => $t('media_manager.upload.status.size_progress', { uploaded, total })
  });
</script>

<div class="flex flex-col gap-2 overflow-y-auto {className}" data-testid="media-upload-list">
  {#each mediaUploadManager.items as item (item.id)}
    <UploadFileCard
      name={item.file.name}
      size={item.file.size}
      status={item.status}
      progress={item.progress}
      errorMessage={item.errorMessage ?? $t('media_manager.upload.errors.generic')}
      {labels}
      class="shrink-0"
      onRemove={() => mediaUploadManager.remove(item.id)}
      onRetry={mediaUploadManager.remainingSlots > 0 ? () => mediaUploadManager.retry(item.id) : undefined}
    />
  {/each}
</div>
