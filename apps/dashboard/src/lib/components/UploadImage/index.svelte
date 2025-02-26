<script lang="ts">
  import DropZone from '$lib/components/DropZone/index.svelte';
  import { snackbar } from '../Snackbar/store';

  export let avatar: string | undefined;
  export let src: string | undefined;
  export let flexDirection = 'flex-col';
  export let isUploading = false;

  const onFileSelected = (e: Event | any) => {
    const image = e.detail.image;

    if (image) {
      avatar = image;
    }
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
  <DropZone
    bind:image={src}
    bind:loading={isUploading}
    on:change={onFileSelected}
    on:clear={clearAvatar}
    on:error={handleError}
    className="rounded-full h-48 w-48 text-center p-4"
    resetButton="top-4 right-4"
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
