<script lang="ts">
  import { Progress } from '@cio/ui/base/progress';
  import * as ImageCropper from '@cio/ui/custom/image-cropper';
  import CameraIcon from '@lucide/svelte/icons/camera';
  import PencilIcon from '@lucide/svelte/icons/pencil';
  import { validateImageUpload } from '$lib/utils/functions/fileValidation';
  import { snackbar } from '$features/ui/snackbar/store';

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
    previewVariant?: 'avatar' | 'signature';
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
    previewVariant = 'avatar',
    change
  }: Props = $props();

  const defaultImg = 'https://cdn4.iconfinder.com/data/icons/small-n-flat/24/user-alt-512.png';
  const isSignaturePreview = $derived(previewVariant === 'signature');

  let cropperSrc = $state('');

  $effect(() => {
    cropperSrc = src || '';
  });

  const onCropped = async (croppedUrl: string) => {
    // Convert the cropped data URL to a File object
    const response = await fetch(croppedUrl);
    const blob = await response.blob();
    // getCroppedImg outputs PNG format, so use blob.type (which will be 'image/png') and matching filename
    const fileName = isSignaturePreview ? 'signature.png' : 'cropped-image.png';
    const file = new File([blob], fileName, { type: blob.type });

    const validation = validateImageUpload(file);
    if (!validation.isValid) {
      snackbar.error(validation.error || 'Invalid file type');
      errorMessage = $t('snackbar.landing_page_settings.error.try_again');

      src = '';

      return;
    }

    // Update avatar with the cropped file
    avatar = file;

    // Update the src preview
    src = croppedUrl;

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

  const previewContainerClass = $derived(
    isSignaturePreview
      ? `signature-preview-bg border-2 border-dashed border-gray-300 ${shape}`
      : `border-2 border-gray-200 ${shape}`
  );

  const previewImageClass = $derived(
    isSignaturePreview ? `h-full w-full object-contain ${shape}` : `h-full w-full ${shape}`
  );
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
      <div class="avatar-container {widthHeight || 'h-[128px] w-[128px]'} pointer {previewContainerClass}">
        <ImageCropper.Preview>
          {#snippet child({ src: imageSrc })}
            <div class="group relative h-full w-full">
              {#if imageSrc || !isSignaturePreview}
                <img class={previewImageClass} src={imageSrc || defaultImg} alt="" />
              {/if}
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
        {#if isSignaturePreview}
          <ImageCropper.UseOriginal>
            {$t('course.navItem.certificates.editor.signature_dont_crop')}
          </ImageCropper.UseOriginal>
        {:else}
          <ImageCropper.Cancel />
        {/if}
        <ImageCropper.Crop />
      </ImageCropper.Controls>
    </ImageCropper.Dialog>
  </ImageCropper.Root>
</section>

<style>
  .signature-preview-bg {
    background-color: #fff;
    background-image:
      linear-gradient(45deg, #e5e5e5 25%, transparent 25%), linear-gradient(-45deg, #e5e5e5 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #e5e5e5 75%), linear-gradient(-45deg, transparent 75%, #e5e5e5 75%);
    background-size: 12px 12px;
    background-position:
      0 0,
      0 6px,
      6px -6px,
      -6px 0;
  }
</style>
