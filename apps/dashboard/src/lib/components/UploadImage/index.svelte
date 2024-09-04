<script lang="ts">
  import Camera from 'carbon-icons-svelte/lib/Camera.svelte';
  import { t } from '$lib/utils/functions/translations';

  export let avatar: string | undefined;
  export let src: string | undefined;
  export let widthHeight = '';
  export let shape = 'rounded-full';
  export let errorMessage: string | null = null;
  export let isDisabled = false;
  export let maxFileSizeInMb: number = 2; // Default max file size 2MB
  export let flexDirection = 'flex-col';

  let fileinput: HTMLInputElement;

  const onFileSelected = (e: Event<HTMLInputElement>) => {
    const image = e.target.files[0];
    const maxFileSize = maxFileSizeInMb * 1024 * 1024;
    if (image.size > maxFileSize) {
      errorMessage = `${$t('settings.profile.profile_picture.validation_error')} ${
        maxFileSize / (1024 * 1024)
      } MB`;
      return;
    }
    let reader = new FileReader();
    reader.readAsDataURL(image);
    reader.onload = (e) => {
      avatar = image;
      // @ts-ignore
      src = e.target?.result || undefined;
      errorMessage = null; // Clear error message on successful load
    };
  };
</script>

<section class="width-fit p-3 flex {flexDirection} items-center justify-between gap-5">
  <div
    class="avatar-container {widthHeight ||
      'setwidthheight'} pointer border-2 border-gray-200 dark:border-neutral-600 relative {shape}"
  >
    {#if src}
      <img class="w-full h-full {shape}" {src} alt="Avatar" />
    {:else if avatar}
      <img class="w-full h-full {shape}" src={avatar} alt="Avatar" />
    {:else}
      <img
        class="w-full h-full {shape}"
        src="https://cdn4.iconfinder.com/data/icons/small-n-flat/24/user-alt-512.png"
        alt=""
      />
    {/if}
  </div>

  <div class="flex flex-col items-center">
    <button
      class="width-fit text-primary-700 flex flex-col items-center text-sm {isDisabled
        ? 'opacity-50 cursor-not-allowed'
        : 'cursor-pointer'}"
      on:click={() => {
        if (!isDisabled) {
          fileinput.click();
        }
      }}
      disabled={isDisabled}
    >
      <Camera size={20} />
      <span class="ml-2">{$t('settings.profile.profile_picture.upload_image')}</span>
    </button>
    <p class="text-xs text-center text-gray-500">
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
    on:change={(e) => onFileSelected(e)}
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
