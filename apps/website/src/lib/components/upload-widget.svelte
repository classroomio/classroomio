<script lang="ts">
  import Copy from '@lucide/svelte/icons/copy';
  import Trash2 from '@lucide/svelte/icons/trash-2';

  export let imageURL = '';
  export let label = '';
  export let isRequired = false;
  export let labelClassName = '';
  let isUploading = false;
  let fileInput: HTMLInputElement;

  const onFileSelected = () => {
    const file = fileInput?.files?.[0];
    const sizeInkb = file?.size! / 1024;
    if (sizeInkb > 500) {
      return;
    }
    if (file) {
      let reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        imageURL = reader.result as string;
      };
    }
  };
  const deleteImage = () => {
    imageURL = '';
    if (fileInput) {
      fileInput.value = '';
    }
  };
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div>
  {#if label}
    <p class="flex w-full items-center justify-between text-left dark:text-white {labelClassName}">
      <span>
        {label}
        {#if isRequired}
          <span class="text-red-700">*</span>
        {/if}
      </span>

      {#if imageURL}
        <span title="clear image" on:click={deleteImage}>
          <Trash2 class="fill-red-500 " />
        </span>
      {/if}
    </p>
  {/if}
  <div
    class="flex min-h-[200px] w-full items-center justify-center rounded-md border p-4"
    on:click={() => fileInput.click()}
  >
    <input
      type="file"
      style="display: none;"
      bind:this={fileInput}
      on:change={onFileSelected}
      disabled={isUploading}
      required={isRequired}
    />
    {#if imageURL}
      <img src={imageURL} alt="selected file" class="mt-4 h-auto w-[30%]" />
    {:else}
      <div class="space-y-4">
        <Copy size={24} class="mx-auto" />
        <p class="my-2 text-center text-sm text-gray-500">Max file size: 10MB, accepted: jpeg, jpg, png, gif</p>
      </div>
    {/if}
  </div>
</div>
