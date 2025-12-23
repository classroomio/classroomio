<script lang="ts">
  import { Progress } from '@cio/ui/base/progress';
  import * as ImageCropper from '@cio/ui/custom/image-cropper';
  import CameraIcon from '@lucide/svelte/icons/camera';

  import { t } from '$lib/utils/functions/translations';

  interface Props {
    avatar: string | File | undefined;
    src: string | undefined | null;
    widthHeight?: string;
    shape?: string;
    errorMessage?: string | null;
    isDisabled?: boolean;
    maxFileSizeInMb?: number; // Default max file size 2MB
    flexDirection?: string;
    isUploading?: boolean;
    change?: () => void;
  }

  let {
    avatar = $bindable(),
    src = $bindable(),
    widthHeight = '',
    shape = 'rounded-full',
    errorMessage = $bindable(null),
    isDisabled = false,
    maxFileSizeInMb = 2,
    flexDirection = 'flex-col',
    isUploading = $bindable(false),
    change
  }: Props = $props();

  const defaultImg = 'https://cdn4.iconfinder.com/data/icons/small-n-flat/24/user-alt-512.png';

  // Local image source for the cropper (never null)
  let cropperSrc = $state(src || '');

  // Keep cropperSrc in sync with src prop
  $effect(() => {
    if (src) {
      cropperSrc = src;
    }
  });

  const onCropped = async (croppedUrl: string) => {
    // Convert the cropped data URL to a File object
    const response = await fetch(croppedUrl);
    const blob = await response.blob();
    const file = new File([blob], 'cropped-image.webp', { type: 'image/webp' });

    // Update avatar with the cropped file
    avatar = file;

    // Update the src preview
    src = croppedUrl;
    cropperSrc = croppedUrl;

    // trigger onchange to parent
    change?.();

    // clear error
    errorMessage = null;
  };

  const onUnsupportedFile = (file: File) => {
    errorMessage = `${$t('settings.profile.profile_picture.validation_error')} Unsupported file type: ${file.type}`;
  };
</script>

<section class="flex w-fit p-3 {flexDirection} items-center justify-between gap-5">
  <ImageCropper.Root bind:src={cropperSrc} {onCropped} {onUnsupportedFile} accept=".jpg, .jpeg, .png, .webp">
    <div
      class="avatar-container {widthHeight ||
        'h-[128px] w-[128px]'} pointer relative border-2 border-gray-200 dark:border-neutral-600 {shape}"
    >
      <ImageCropper.UploadTrigger>
        <ImageCropper.Preview>
          {#snippet child({ src: imageSrc })}
            <img class="h-full w-full {shape}" src={imageSrc || defaultImg} alt="" />
          {/snippet}
        </ImageCropper.Preview>
      </ImageCropper.UploadTrigger>
    </div>

    <div class="flex flex-col items-center">
      <ImageCropper.UploadTrigger>
        <button
          type="button"
          class="width-fit text-primary-700 flex flex-col items-center text-sm {isDisabled || isUploading
            ? 'cursor-not-allowed opacity-50'
            : 'cursor-pointer'}"
          disabled={isDisabled || isUploading}
        >
          {#if isUploading}
            <Progress />
          {:else}
            <CameraIcon size={16} />
          {/if}
          <span class="ml-2">{$t('settings.profile.profile_picture.upload_image')}</span>
        </button>
      </ImageCropper.UploadTrigger>
      <p class="text-center text-xs text-gray-500">
        {$t('settings.profile.profile_picture.file_size')}
        {maxFileSizeInMb}MB<br />
        {$t('settings.profile.profile_picture.accepted')}: jpeg, jpg, png, webp
      </p>
      {#if errorMessage}
        <p class="text-sm text-red-500">{errorMessage}</p>
      {/if}
    </div>

    <ImageCropper.Dialog>
      <ImageCropper.Cropper cropShape={shape === 'rounded-full' ? 'round' : 'rect'} />
      <ImageCropper.Controls>
        <ImageCropper.Cancel />
        <ImageCropper.Crop />
      </ImageCropper.Controls>
    </ImageCropper.Dialog>
  </ImageCropper.Root>
</section>
