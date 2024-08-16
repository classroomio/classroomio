<script lang="ts">
  import ImageCopy from 'carbon-icons-svelte/lib/ImageCopy.svelte';
  import TrashCan from 'carbon-icons-svelte/lib/TrashCan.svelte';

  //   export let imageURL = '';
  export let label = '';
  export let isRequired = false;
  export let labelClassName = '';
  let isUploading = false;
  let fileInput: HTMLInputElement;
  let imageURL = '';

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
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div>
  {#if label}
    <p class="dark:text-white text-left w-full flex items-center justify-between {labelClassName}">
      <span>
        {label}
        {#if isRequired}
          <span class="text-red-700">*</span>
        {/if}
      </span>

      {#if imageURL}
        <span title="clear image" on:click={() => (imageURL = '')}>
          <TrashCan class="fill-red-500 " />
        </span>
      {/if}
    </p>
  {/if}
  <div
    class="flex items-center justify-center w-full border rounded-md min-h-[200px] p-4"
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
      <img src={imageURL} alt="selected file" class="w-[30%] h-auto mt-4" />
    {:else}
      <div class="space-y-4">
        <ImageCopy size={24} class="mx-auto" />
        <p class="text-center text-sm text-gray-500 my-2">
          Max file size: 10MB, accepted: jpeg, jpg, png, gif
        </p>
      </div>
    {/if}
  </div>
</div>
