<script lang="ts">
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import * as FileDropZone from '@cio/ui/custom/file-drop-zone';
  import type { FileRejectedReason } from '@cio/ui/custom/file-drop-zone';
  import { formatFileSize } from '@cio/ui/custom/attachment-list';
  import Minimize2Icon from '@lucide/svelte/icons/minimize-2';
  import PlusIcon from '@lucide/svelte/icons/plus';

  import { UpgradeBanner } from '$features/ui';
  import { snackbar } from '$features/ui/snackbar/store';
  import { mediaUploadManager } from '$features/media/api';
  import {
    MEDIA_UPLOAD_ACCEPT_ATTRIBUTE,
    MEDIA_UPLOAD_MAX_FILES,
    MEDIA_UPLOAD_MAX_FILE_BYTES,
    resolveMediaUploadSizeLimits
  } from '$features/media/utils';
  import type { MediaUploadRejection } from '$features/media/utils';
  import { getResolvedUploadLimits } from '$lib/utils/config/upload-limits-context';
  import { t } from '$lib/utils/functions/translations';
  import { isFreePlan } from '$lib/utils/store/org';

  import MediaUploadList from './media-upload-list.svelte';

  const deploymentLimits = getResolvedUploadLimits();
  const sizeLimits = resolveMediaUploadSizeLimits(deploymentLimits);

  const isOpen = $derived(mediaUploadManager.view === 'dialog');
  const hasFiles = $derived(mediaUploadManager.items.length > 0);
  const limitsCopy = $derived(
    sizeLimits.video === sizeLimits.document
      ? $t('media_manager.upload.limits', { count: MEDIA_UPLOAD_MAX_FILES, size: formatFileSize(sizeLimits.video) })
      : $t('media_manager.upload.limits_by_kind', {
          count: MEDIA_UPLOAD_MAX_FILES,
          videoSize: formatFileSize(sizeLimits.video),
          documentSize: formatFileSize(sizeLimits.document)
        })
  );

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) return;

    mediaUploadManager.closeDialog();
  }

  function rejectionMessage(rejection: MediaUploadRejection): string {
    if (rejection.reason === 'too_large') {
      const size = formatFileSize(rejection.maxBytes ?? MEDIA_UPLOAD_MAX_FILE_BYTES);
      return $t('media_manager.upload.errors.too_large', { name: rejection.file.name, size });
    }

    if (rejection.reason === 'too_many') {
      return $t('media_manager.upload.errors.too_many', { count: MEDIA_UPLOAD_MAX_FILES });
    }

    return $t('media_manager.upload.errors.unsupported_type', { name: rejection.file.name });
  }

  async function handleFilesPicked(files: File[]) {
    if ($isFreePlan) {
      snackbar.error($t('upgrade.required'));
      return;
    }

    const rejections = mediaUploadManager.add(files, sizeLimits);
    const messages = rejections.map(rejectionMessage);
    const uniqueMessages = messages.filter((message, index) => messages.indexOf(message) === index);

    for (const message of uniqueMessages) snackbar.error(message);
  }

  function handleFileRejected(rejected: { reason: FileRejectedReason; file: File }) {
    if (rejected.reason === 'Maximum file size exceeded') {
      snackbar.error(rejectionMessage({ file: rejected.file, reason: 'too_large' }));
      return;
    }

    snackbar.error(rejectionMessage({ file: rejected.file, reason: 'unsupported_type' }));
  }
</script>

<Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
  <Dialog.Content class="max-w-xl!" data-testid="media-upload-dialog">
    <Dialog.Header>
      <Dialog.Title>{$t('media_manager.upload.dialog_title')}</Dialog.Title>
      <Dialog.Description>{limitsCopy}</Dialog.Description>
    </Dialog.Header>

    {#if hasFiles}
      <Button
        variant="secondary"
        size="icon-xs"
        class="absolute end-12 top-3.5"
        aria-label={$t('media_manager.upload.minimize')}
        title={$t('media_manager.upload.minimize')}
        testId="media-upload-minimize"
        onclick={() => mediaUploadManager.minimize()}
      >
        <Minimize2Icon />
      </Button>
    {/if}

    <UpgradeBanner onClick={() => mediaUploadManager.closeDialog()}>
      {$t('media_manager.upload.upgrade')}
    </UpgradeBanner>

    <div class="flex flex-col gap-3">
      {#if hasFiles}
        <MediaUploadList class="max-h-[40vh]" />
      {/if}

      {#if mediaUploadManager.remainingSlots > 0}
        <div class={$isFreePlan ? 'pointer-events-none opacity-50' : ''}>
          <FileDropZone.Root
            accept={MEDIA_UPLOAD_ACCEPT_ATTRIBUTE}
            maxFileSize={MEDIA_UPLOAD_MAX_FILE_BYTES}
            onUpload={handleFilesPicked}
            onFileRejected={handleFileRejected}
          >
            {#if hasFiles}
              <FileDropZone.Trigger>
                <div
                  class="ui:text-muted-foreground ui:hover:bg-accent/25 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-2.5 text-sm transition-colors"
                >
                  <PlusIcon class="size-4" />
                  {$t('media_manager.upload.add_more')}
                </div>
              </FileDropZone.Trigger>
            {:else}
              <FileDropZone.Trigger label={$t('media_manager.upload.drag_drop')} formatMaxSize={() => ''} />
            {/if}
          </FileDropZone.Root>
        </div>
      {/if}
    </div>

    {#if hasFiles}
      <Dialog.Footer>
        {#if mediaUploadManager.isUploading}
          <Button variant="outline" size="sm" onclick={() => mediaUploadManager.minimize()}>
            {$t('media_manager.upload.keep_in_background')}
          </Button>
        {:else}
          <Button size="sm" testId="media-upload-done" onclick={() => mediaUploadManager.dismiss()}>
            {$t('media_manager.upload.done')}
          </Button>
        {/if}
      </Dialog.Footer>
    {/if}
  </Dialog.Content>
</Dialog.Root>
