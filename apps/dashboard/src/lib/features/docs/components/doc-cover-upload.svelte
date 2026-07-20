<script lang="ts">
  import ImageIcon from '@lucide/svelte/icons/image';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import * as Dialog from '@cio/ui/base/dialog';
  import * as ImageCropper from '@cio/ui/custom/image-cropper';
  import { Button } from '@cio/ui/base/button';
  import { Spinner } from '@cio/ui/base/spinner';
  import UploadCloudIcon from '@lucide/svelte/icons/upload-cloud';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import { uploadImage } from '$lib/utils/services/upload';
  import { getResolvedUploadLimits } from '$lib/utils/config/upload-limits-context';

  interface Props {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    onUploaded?: (url: string) => void | Promise<void>;
  }

  let { open = $bindable(false), onOpenChange, onUploaded }: Props = $props();

  const COVER_ASPECT = 3;
  const uploadLimits = getResolvedUploadLimits();
  const maxImageSize = uploadLimits.landingImageBytes;

  let cropperSrc = $state('');
  let isUploading = $state(false);

  async function handleCropped(croppedUrl: string) {
    isUploading = true;

    try {
      const response = await fetch(croppedUrl);
      const blob = await response.blob();
      const file = new File([blob], 'note-cover.png', { type: blob.type });
      const url = await uploadImage(file);

      await onUploaded?.(url);
      open = false;
      cropperSrc = '';
    } catch (error) {
      console.error('Failed to upload note cover:', error);
      snackbar.error('docs.page.cover_upload_error');
    } finally {
      isUploading = false;
    }
  }

  function handleUnsupportedFile() {
    snackbar.error('snackbar.landing_page_settings.error.file_size');
  }
</script>

<Dialog.Root bind:open {onOpenChange}>
  <Dialog.Content class="max-w-2xl">
    <Dialog.Header>
      <Dialog.Title>{$t('docs.page.add_cover')}</Dialog.Title>
      <Dialog.Description>{$t('docs.page.add_cover_description')}</Dialog.Description>
    </Dialog.Header>

    <div class={isUploading ? 'pointer-events-none opacity-60' : ''}>
      <ImageCropper.Root
        bind:src={cropperSrc}
        onCropped={handleCropped}
        onUnsupportedFile={handleUnsupportedFile}
        maxFileSize={maxImageSize}
        accept=".jpg,.jpeg,.png,.webp"
        disabled={isUploading}
      >
        <ImageCropper.UploadTrigger
          class="ui:flex ui:w-full ui:flex-col ui:items-center ui:justify-center ui:gap-2 ui:rounded-lg ui:border-2 ui:border-dashed ui:border-input ui:bg-muted/30 ui:px-6 ui:py-10 ui:text-center ui:transition-colors ui:hover:bg-muted/60"
        >
          {#if isUploading}
            <Spinner />
          {:else}
            <UploadCloudIcon class="ui:text-muted-foreground" size={28} />
          {/if}
          <p class="ui:m-0 ui:text-sm ui:font-medium">{$t('docs.page.upload_cover_prompt')}</p>
        </ImageCropper.UploadTrigger>

        <ImageCropper.Dialog class="ui:z-[400]!">
          <ImageCropper.Cropper cropShape="rect" aspect={COVER_ASPECT} />
          <ImageCropper.Controls>
            <ImageCropper.Cancel />
            <ImageCropper.Crop />
          </ImageCropper.Controls>
        </ImageCropper.Dialog>
      </ImageCropper.Root>
    </div>
  </Dialog.Content>
</Dialog.Root>
