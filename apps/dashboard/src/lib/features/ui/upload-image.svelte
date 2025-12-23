<script lang="ts">
  import { Progress } from '@cio/ui/base/progress';
  import * as ImageCropper from '@cio/ui/custom/image-cropper';
  import CameraIcon from '@lucide/svelte/icons/camera';
  import PencilIcon from '@lucide/svelte/icons/pencil';

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
  let cropperSrc = $derived(src || '');

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
    const maxFileSizeInBytes = maxFileSizeInMb * 1024 * 1024;

    // Check if error is due to file size
    if (file.size > maxFileSizeInBytes) {
      errorMessage = `${$t('settings.profile.profile_picture.validation_error')} File size exceeds ${maxFileSizeInMb}MB limit`;
      return;
    }

    // Otherwise, it's an unsupported file type
    errorMessage = `${$t('settings.profile.profile_picture.validation_error')} Unsupported file type: ${file.type}`;
  };
</script>

<section class="flex w-fit p-3 {flexDirection} items-center justify-between gap-2">
  <ImageCropper.Root
    bind:src={cropperSrc}
    {onCropped}
    {onUnsupportedFile}
    maxFileSize={maxFileSizeInMb * 1024 * 1024}
    accept=".jpg, .jpeg, .png, .webp"
    disabled={isDisabled || isUploading}
  >
    <ImageCropper.UploadTrigger aria-disabled={isDisabled || isUploading}>
      <div
        class="avatar-container {widthHeight ||
          'h-[128px] w-[128px]'} pointer border-2 border-gray-200 dark:border-neutral-600 {shape}"
      >
        <ImageCropper.Preview>
          {#snippet child({ src: imageSrc })}
            <div class="group relative h-full w-full">
              <img class="h-full w-full {shape}" src={imageSrc || defaultImg} alt="" />
              <div
                class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100 {shape}"
              >
                <PencilIcon class="stroke-white" size={16} />
              </div>
            </div>
          {/snippet}
        </ImageCropper.Preview>
      </div>

      <div class="mt-1 flex flex-col items-center">
        {#if isUploading}
          <Progress />
        {:else}
          <CameraIcon size={16} />
        {/if}
        <span class="text-sm">{$t('settings.profile.profile_picture.upload_image')}</span>
      </div>
    </ImageCropper.UploadTrigger>
    <div class="flex flex-col items-center">
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
