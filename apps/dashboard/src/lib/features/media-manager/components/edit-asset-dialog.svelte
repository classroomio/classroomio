<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import * as Dialog from '@cio/ui/base/dialog';
  import * as FileDropZone from '@cio/ui/custom/file-drop-zone';
  import type { FileRejectedReason } from '@cio/ui/custom/file-drop-zone';
  import { InputField } from '@cio/ui/custom/input-field';
  import * as Select from '@cio/ui/base/select';
  import { TextareaField } from '@cio/ui/custom/textarea-field';

  import type { TAssetUpdate } from '@cio/utils/validation/assets';
  import type { OrganizationAsset } from '$features/media-manager/utils';
  import { snackbar } from '$features/ui/snackbar/store';
  import { t } from '$lib/utils/functions/translations';
  import { uploadImage } from '$lib/utils/services/upload';

  interface Props {
    open?: boolean;
    asset?: OrganizationAsset | null;
    isSaving?: boolean;
    onSave?: (fields: TAssetUpdate) => Promise<void> | void;
  }

  type AssetStatusValue = 'active' | 'archived';

  const THUMBNAIL_MAX_SIZE = 5 * FileDropZone.MEGABYTE;

  let { open = $bindable(false), asset = null, isSaving = false, onSave = async () => {} }: Props = $props();

  let isThumbnailUploading = $state(false);
  let title = $state('');
  let description = $state('');
  let thumbnailUrl = $state('');
  let status = $state<AssetStatusValue>('active');

  const canSubmit = $derived(Boolean(asset) && !isSaving && !isThumbnailUploading);

  function setFormValues(nextAsset: OrganizationAsset | null) {
    title = nextAsset?.title ?? '';
    description = nextAsset?.description ?? '';
    thumbnailUrl = nextAsset?.thumbnailUrl ?? '';
    status = nextAsset?.status === 'archived' ? 'archived' : 'active';
  }

  function resetForm() {
    setFormValues(asset);
    isThumbnailUploading = false;
  }

  $effect(() => {
    if (!open) {
      return;
    }

    setFormValues(asset);
  });

  async function saveAsset() {
    if (!asset) {
      return;
    }

    await onSave({
      title: title.trim() || undefined,
      description: description.trim() || undefined,
      thumbnailUrl: thumbnailUrl.trim() || undefined,
      status
    });
  }

  async function handleThumbnailFilesUpload(files: File[]) {
    const file = files[0];
    if (!file) {
      return;
    }

    isThumbnailUploading = true;
    try {
      const uploadedUrl = await uploadImage(file);
      thumbnailUrl = uploadedUrl;
      snackbar.success('snackbar.media_manager.thumbnail_uploaded');
    } catch {
      snackbar.error('snackbar.media_manager.thumbnail_upload_failed');
    } finally {
      isThumbnailUploading = false;
    }
  }

  function handleThumbnailRejected({ reason }: { reason: FileRejectedReason }) {
    if (reason === 'Maximum file size exceeded') {
      snackbar.error('snackbar.media_manager.thumbnail_too_large');
      return;
    }

    snackbar.error('snackbar.media_manager.thumbnail_invalid');
  }
</script>

<Dialog.Root
  bind:open
  onOpenChange={(isOpen) => {
    if (!isOpen) {
      resetForm();
    }
  }}
>
  <Dialog.Content class="max-h-[60vh] w-[95%] max-w-2xl overflow-y-auto">
    <Dialog.Header>
      <Dialog.Title>{$t('media_manager.edit.title')}</Dialog.Title>
      <Dialog.Description>{$t('media_manager.edit.description')}</Dialog.Description>
    </Dialog.Header>

    {#if asset}
      <div class="space-y-4 p-1">
        <InputField label={$t('media_manager.form.file_name')} bind:value={title} />
        <TextareaField
          label={$t('media_manager.form.description')}
          bind:value={description}
          rows={3}
          placeholder={$t('media_manager.form.description_placeholder')}
        />

        <div class="space-y-2">
          <p class="text-sm font-medium">{$t('media_manager.form.thumbnail_upload')}</p>
          <div class={isThumbnailUploading ? 'ui:pointer-events-none ui:opacity-50' : ''}>
            <FileDropZone.Root
              accept={FileDropZone.ACCEPT_IMAGE}
              maxFiles={1}
              fileCount={0}
              maxFileSize={THUMBNAIL_MAX_SIZE}
              onUpload={handleThumbnailFilesUpload}
              onFileRejected={handleThumbnailRejected}
            >
              <FileDropZone.Trigger
                label={$t('media_manager.form.thumbnail_drop_label')}
                formatMaxSize={() => $t('media_manager.form.thumbnail_drop_size')}
              />
            </FileDropZone.Root>
          </div>
        </div>

        {#if thumbnailUrl}
          <div class="rounded-md border p-3">
            <p class="ui:text-muted-foreground mb-2 text-xs">{$t('media_manager.form.thumbnail_preview')}</p>
            <img
              src={thumbnailUrl}
              alt={$t('media_manager.form.thumbnail_alt')}
              class="max-h-40 w-auto rounded object-cover"
            />
          </div>
        {/if}

        <div class="space-y-2">
          <p class="text-sm font-medium">{$t('media_manager.form.status')}</p>
          <Select.Root type="single" bind:value={status}>
            <Select.Trigger class="w-full">
              <p>{$t(`media_manager.status.${status}`)}</p>
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="active">{$t('media_manager.status.active')}</Select.Item>
              <Select.Item value="archived">{$t('media_manager.status.archived')}</Select.Item>
            </Select.Content>
          </Select.Root>
        </div>
      </div>
    {/if}

    <Dialog.Footer>
      <Button variant="outline" onclick={() => (open = false)}>
        {$t('media_manager.edit.cancel')}
      </Button>
      <Button onclick={saveAsset} loading={isSaving} disabled={!canSubmit}>
        {$t('media_manager.edit.save')}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
