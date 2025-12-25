<script lang="ts">
  import Copy from '@lucide/svelte/icons/copy';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import { ALLOWED_IMAGE_TYPES, validateImageUpload } from '@cio/utils/functions/fileValidation';

  interface Props {
    imageURL?: string;
    label?: string;
    isRequired?: boolean;
    labelClassName?: string;
  }

  let { imageURL = $bindable(''), label = '', isRequired = false, labelClassName = '' }: Props = $props();
  let isUploading = false;
  let fileInput: HTMLInputElement = $state();

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

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
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
        <span title="clear image" onclick={deleteImage}>
          <Trash2 class="fill-red-500 " />
        </span>
      {/if}
    </p>
  {/if}
  <div
    class="flex min-h-[200px] w-full items-center justify-center rounded-md border p-4"
    onclick={() => fileInput.click()}
  >
    <input
      type="file"
      accept=".jpg,.jpeg,.png,.gif,.webp,image/jpeg,image/png,image/gif,image/webp"
      style="display: none;"
      bind:this={fileInput}
      onchange={onFileSelected}
      disabled={isUploading}
      required={isRequired}
    />
    {#if imageURL}
      <img src={imageURL} alt="selected file" class="mt-4 h-auto w-[30%]" />
    {:else}
      <div class="space-y-4">
        <Copy size={24} class="mx-auto" />
        <p class="my-2 text-center text-sm text-gray-500">Max file size: 2MB, accepted: JPEG, PNG, GIF, WebP only</p>
      </div>
    {/if}
  </div>
</div>
