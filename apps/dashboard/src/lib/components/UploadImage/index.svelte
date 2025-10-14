<script lang="ts">
  import { t } from '$lib/utils/functions/translations';
  import { Loading } from 'carbon-components-svelte';
  import CameraIcon from '@lucide/svelte/icons/camera';

  interface Props {
    avatar: string | File | undefined;
    src: string | undefined;
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
    src,
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
  let fileinput: HTMLInputElement | undefined = $state();
  let imgRef: HTMLImageElement | undefined = $state();

  const onFileSelected = (
    e: Event & {
      currentTarget: EventTarget & HTMLInputElement;
    }
  ) => {
    const image = e.currentTarget?.files?.[0];
    if (!image) return;

    const maxFileSize = maxFileSizeInMb * 1024 * 1024;
    if (image.size > maxFileSize) {
      errorMessage = `${$t('settings.profile.profile_picture.validation_error')} ${maxFileSize / (1024 * 1024)} MB`;
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', function () {
      if (!imgRef || !reader.result) return;

      // pass image as avatar to parent component
      avatar = image;

      // update the image src on the DOM
      imgRef.setAttribute('src', reader.result.toString());

      // trigger onchange to parent
      change?.();

      // clear error
      errorMessage = null;
    });
    reader.readAsDataURL(image);
  };
</script>

<section class="width-fit flex p-3 {flexDirection} items-center justify-between gap-5">
  <div
    class="avatar-container {widthHeight ||
      'setwidthheight'} pointer relative border-2 border-gray-200 dark:border-neutral-600 {shape}"
  >
    <img bind:this={imgRef} class="h-full w-full {shape}" src={src || defaultImg} alt="" />
  </div>

  <div class="flex flex-col items-center">
    <button
      class="width-fit text-primary-700 flex flex-col items-center text-sm {isDisabled || isUploading
        ? 'cursor-not-allowed opacity-50'
        : 'cursor-pointer'}"
      onclick={() => {
        if (!isDisabled || isUploading) {
          fileinput?.click();
        }
      }}
      disabled={isDisabled || isUploading}
    >
      {#if isUploading}
        <Loading withOverlay={false} small />
      {:else}
        <CameraIcon />
      {/if}
      <span class="ml-2">{$t('settings.profile.profile_picture.upload_image')}</span>
    </button>
    <p class="text-center text-xs text-gray-500">
      {$t('settings.profile.profile_picture.file_size')}
      {maxFileSizeInMb}MB<br />
      {$t('settings.profile.profile_picture.accepted')}: jpeg, jpg, png, webp
    </p>
    {#if errorMessage}
      <p class="text-sm text-red-500">{errorMessage}</p>
    {/if}
  </div>

  <input
    style="display:none"
    type="file"
    accept=".jpg, .jpeg, .png, .webp"
    onchange={(e) => onFileSelected(e)}
    bind:this={fileinput}
  />
</section>

<style>
  .width-fit {
    width: fit-content;
  }

  .avatar-container.setwidthheight {
    height: 128px;
    width: 128px;
  }

  .upload-icon {
    display: none;
  }
</style>
