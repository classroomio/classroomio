<script lang="ts">
  import Copy from '@lucide/svelte/icons/copy';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import { ALLOWED_IMAGE_TYPES, validateImageUpload } from '@cio/utils/functions/fileValidation';

  export let imageURL = '';
  export let label = '';
  export let isRequired = false;
  export let labelClassName = '';
  let isUploading = false;
  let fileInput: HTMLInputElement;

  const onFileSelected = () => {
    const file = fileInput?.files?.[0];
    if (!file) return;

    // Validate file type first (security check)
    const validation = validateImageUpload(file);
    if (!validation.isValid) {
      alert(validation.error);

      fileInput.value = '';
      return;
    }

    // Validate file type to prevent SVG XSS attacks
    if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
      alert('Invalid file type. Only JPEG, PNG, GIF, and WebP files are allowed.');
      fileInput.value = '';
      return;
    }

    const sizeInMB = file?.size! / 1024 / 1024;
    if (sizeInMB > 2) {
      fileInput.value = '';
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
      accept=".jpg,.jpeg,.png,.gif,.webp,image/jpeg,image/png,image/gif,image/webp"
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
        <p class="text-center text-sm text-gray-500 my-2">
          Max file size: 2MB, accepted: JPEG, PNG, GIF, WebP only
        </p>
      </div>
    {/if}
  </div>
</div>
