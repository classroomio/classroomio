<script lang="ts">
  import DropZone from '$lib/components/DropZone/index.svelte';
  import Modal from '$lib/components/Modal/index.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { Loading } from 'carbon-components-svelte';
  import Camera from 'carbon-icons-svelte/lib/Camera.svelte';
  import { handleOpenWidget } from '../CourseLandingPage/store';
  import { snackbar } from '../Snackbar/store';

  export let avatar: string | undefined;
  export let src: string | undefined;
  export let widthHeight = '';
  export let shape = 'rounded-full';
  export let errorMessage: string | null = null;
  export let isDisabled = false;
  export let maxFileSizeInMb: number = 2; // Default max file size 2MB
  export let flexDirection = 'flex-col';
  export let isUploading = false;

  let fileinput: HTMLInputElement;

  // const onFileSelected = (e: Event<HTMLInputElement>) => {
  //   const image = e.target.files[0];
  //   const maxFileSize = maxFileSizeInMb * 1024 * 1024;
  //   if (image.size > maxFileSize) {
  //     errorMessage = `${$t('settings.profile.profile_picture.validation_error')} ${
  //       maxFileSize / (1024 * 1024)
  //     } MB`;
  //     return;
  //   }
  //   let reader = new FileReader();
  //   reader.readAsDataURL(image);
  //   reader.onload = (e) => {
  //     avatar = image;
  //     // @ts-ignore
  //     src = e.target?.result || undefined;
  //     errorMessage = null; // Clear error message on successful load
  //   };
  // };

  // new method
  const onFileSelected = (e: Event | any) => {
    const image = e.detail.image;

    if (image) {
      avatar = image;
    }
    $handleOpenWidget.open = false;
  };
  const clearAvatar = () => {
    src = undefined;
    avatar = undefined;
  };
  const handleError = (event) => {
    const error = event.detail.error;
    snackbar.error(error);
  };
</script>

<section class="width-fit flex p-3 {flexDirection} items-center justify-between gap-5">
  <div
    class="avatar-container {widthHeight ||
      'setwidthheight'} pointer relative border-2 border-gray-200 dark:border-neutral-600 {shape}"
  >
    {#if src}
      <img class="h-full w-full {shape}" {src} alt="Avatar" />
    {:else if avatar}
      <img class="h-full w-full {shape}" src={avatar} alt="Avatar" />
    {:else}
      <img
        class="h-full w-full {shape}"
        src="https://cdn4.iconfinder.com/data/icons/small-n-flat/24/user-alt-512.png"
        alt=""
      />
    {/if}
  </div>

  <div class="flex flex-col items-center">
    <button
      class="width-fit text-primary-700 flex flex-col items-center text-sm {isDisabled ||
      isUploading
        ? 'cursor-not-allowed opacity-50'
        : 'cursor-pointer'}"
      on:click={() => {
        if (!isDisabled || isUploading) {
          $handleOpenWidget.open = true;
        }
      }}
      disabled={isDisabled || isUploading}
    >
      {#if isUploading}
        <Loading withOverlay={false} small />
      {:else}
        <Camera size={20} />
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

  <!-- <input
    style="display:none"
    type="file"
    accept=".jpg, .jpeg, .png, .webp"
    on:change={(e) => onFileSelected(e)}
    bind:this={fileinput}
  /> -->

  <Modal
    onClose={() => ($handleOpenWidget.open = false)}
    bind:open={$handleOpenWidget.open}
    width="w-3/5"
    maxWidth=""
    containerClass="flex items-center justify-center w-full"
    modalHeading={$t('course.navItem.landing_page.upload_widget.title')}
  >
    <DropZone
      bind:image={src}
      bind:loading={isUploading}
      on:change={onFileSelected}
      on:clear={clearAvatar}
      on:error={handleError}
      className="h-48 w-48 text-center p-4"
    />
  </Modal>
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
