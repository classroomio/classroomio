<script lang="ts">
  import IconButton from '$lib/components/IconButton/index.svelte';
  import { cn } from '$lib/utils/functions/cn';
  import { t } from '$lib/utils/functions/translations';
  import Close from 'carbon-icons-svelte/lib/Close.svelte';
  import CloudUpload from 'carbon-icons-svelte/lib/CloudUpload.svelte';
  import { createEventDispatcher } from 'svelte';
  import { snackbar } from '../Snackbar/store';

  export let image: any | null = null;
  export let loading = false;
  export let className = '';
  export let resetButton = '';

  let fileInput: HTMLInputElement;
  let isDragging = false;
  const dispatch = createEventDispatcher();

  function handleDragEnter(event) {
    event.preventDefault();
    isDragging = true;
  }

  function handleDragLeave(event) {
    event.preventDefault();
    isDragging = false;
  }

  function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    isDragging = false;
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      loadImage(file);
    }
  }

  async function handleFileSelect(event) {
    const file = event.target.files[0];
    console.log('Selected file:', file);
    const sizeInkb = file?.size! / 1024;
    if (sizeInkb > 2000) {
      snackbar.error('snackbar.landing_page_settings.error.file_size');
      dispatch('error', { error: 'snackbar.landing_page_settings.error.try_again' }); // still unsure if this is neccessary
      return;
    }

    if (file && file.type.startsWith('image/')) {
      await loadImage(file);
    } else {
      console.error('Not a valid file');
    }
    // Reset the input value to allow selecting the same file again
    event.target.value = null;
  }

  function triggerFileInput(event) {
    event.stopPropagation();
    fileInput.click();
  }

  async function loadImage(file) {
    loading = true;
    dispatch('loading', { loading: true });

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const result = reader.result;
        image = result;
        dispatch('change', { image: file });
        loading = false;
        resolve(result);
        dispatch('success'); // not sure if this needed, since the upload logic is mainly handled from the parent
      };

      reader.onerror = (error) => {
        console.error('File reading error:', error);
        loading = false;
        dispatch('error', { error: error });
        reject(error);
      };

      reader.readAsDataURL(file);
    });
  }

  function clearImage(event) {
    image = null;
    dispatch('clear');
  }
</script>

<div
  class={cn(
    'relative flex h-64 w-96 cursor-pointer items-center justify-center overflow-hidden rounded-md border-2 border-dashed border-gray-400 text-gray-500 transition-all',
    isDragging ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-600',
    className
  )}
  on:dragenter={handleDragEnter}
  on:dragleave={handleDragLeave}
  on:dragover|preventDefault
  on:drop={handleDrop}
  on:click={triggerFileInput}
  on:keydown={(e) => e.key === 'Enter' && triggerFileInput(e)}
  role="button"
  tabindex="0"
>
  {#if loading}
    <div class="absolute inset-0 flex items-center justify-center bg-white/70">
      <div
        class="h-8 w-8 animate-spin rounded-full border-4 border-gray-500 border-t-transparent"
      ></div>
    </div>
  {/if}

  {#if image}
    <img
      src={image}
      alt="Uploaded avatar"
      class="absolute left-0 top-0 h-full w-full object-cover transition-opacity duration-300 hover:opacity-20"
    />
    <IconButton
      buttonClassName={cn(
        'absolute right-2 top-2 rounded-full bg-white p-1 text-gray-700 shadow-md hover:bg-gray-200',
        resetButton
      )}
      onClick={clearImage}
      stopPropagation={true}
    >
      <Close />
    </IconButton>
  {/if}

  <div class="flex flex-col items-center justify-center transition-opacity duration-300">
    <CloudUpload />
    <p>{$t('course.navItem.landing_page.upload_widget.drag_n_drop')}</p>
    <p>{$t('course.navItem.landing_page.upload_widget.or')}</p>
    <span class="rounded-md border bg-slate-500 p-2 text-white hover:bg-slate-700">
      {$t('course.navItem.landing_page.upload_widget.click_to_upload')}
    </span>
  </div>

  <input
    type="file"
    accept="image/*"
    class="hidden"
    bind:this={fileInput}
    on:change={handleFileSelect}
  />
</div>
