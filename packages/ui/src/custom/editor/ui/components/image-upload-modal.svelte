<script lang="ts">
  import type { Editor } from '@tiptap/core';
  import * as Dialog from '$src/base/dialog';
  import * as UnderlineTabs from '../../../underline-tabs';
  import * as ImageCropper from '../../../image-cropper';
  import { Button } from '$src/base/button';
  import { InputField } from '../../../input-field';
  import UploadCloudIcon from '@lucide/svelte/icons/upload-cloud';
  import LoaderCircle from '@lucide/svelte/icons/loader-circle';

  interface Props {
    editor: Editor;
    open?: boolean;
    onImageUpload?: (file: File) => Promise<string>;
  }

  let { editor, open = $bindable(false), onImageUpload }: Props = $props();

  const tabs = $derived([
    ...(onImageUpload ? [{ label: 'Upload', value: 'upload' }] : []),
    { label: 'Link', value: 'link' }
  ]);

  let currentTab = $state(tabs[0].value);
  let cropperSrc = $state('');
  let isUploading = $state(false);

  let imageUrl = $state('');

  function insertImage(src: string) {
    if (!src || !editor || editor.isDestroyed) return;
    editor.chain().focus().setImage({ src }).run();
    open = false;
  }

  async function handleCropped(croppedUrl: string) {
    if (!onImageUpload) return;
    try {
      isUploading = true;
      const file = await ImageCropper.getFileFromUrl(croppedUrl);
      const url = await onImageUpload(file);
      if (url) insertImage(url);
    } catch (error) {
      console.error('Image upload failed:', error);
      window.alert('Failed to upload image');
    } finally {
      isUploading = false;
    }
  }

  function handleUnsupportedFile(file: File) {
    window.alert(`Unsupported image: ${file.type}`);
  }

  function handleUrlInsert() {
    if (imageUrl.trim()) insertImage(imageUrl.trim());
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="ui:z-[300]! ui:w-[95%] ui:max-w-2xl!">
    <Dialog.Header>
      <Dialog.Title>Insert image</Dialog.Title>
    </Dialog.Header>
    <div class="ui:w-full ui:p-2">
      <UnderlineTabs.Root bind:value={currentTab}>
        <UnderlineTabs.List>
          {#each tabs as tab}
            <UnderlineTabs.Trigger value={tab.value}>
              {tab.label}
            </UnderlineTabs.Trigger>
          {/each}
        </UnderlineTabs.List>

        {#if onImageUpload}
          <UnderlineTabs.Content value="upload">
            <div class="ui:w-full">
              <ImageCropper.Root
                bind:src={cropperSrc}
                onCropped={handleCropped}
                onUnsupportedFile={handleUnsupportedFile}
                accept=".jpg, .jpeg, .png, .webp"
                disabled={isUploading}
              >
                <ImageCropper.UploadTrigger
                  class="ui:flex ui:w-full ui:cursor-pointer ui:flex-col ui:items-center ui:justify-center ui:gap-2 ui:rounded-lg ui:border-2 ui:border-dashed ui:border-input ui:bg-muted/30 ui:px-6 ui:py-10 ui:text-center ui:transition-colors ui:hover:bg-muted/60"
                >
                  {#if isUploading}
                    <LoaderCircle class="ui:text-muted-foreground ui:size-6 ui:animate-spin" />
                    <p class="ui:m-0 ui:text-sm ui:font-medium">Uploading…</p>
                  {:else}
                    <UploadCloudIcon class="ui:text-muted-foreground" size={28} />
                    <p class="ui:m-0 ui:text-sm ui:font-medium">Drag and drop an image here, or click to select</p>
                    <p class="ui:m-0 ui:text-xs ui:text-muted-foreground">Accepted: jpeg, jpg, png, webp</p>
                  {/if}
                </ImageCropper.UploadTrigger>

                <ImageCropper.Dialog class="ui:z-[350]!">
                  <ImageCropper.Cropper cropShape="rect" />
                  <ImageCropper.Controls>
                    <ImageCropper.Cancel />
                    <ImageCropper.Crop />
                  </ImageCropper.Controls>
                </ImageCropper.Dialog>
              </ImageCropper.Root>
            </div>
          </UnderlineTabs.Content>
        {/if}

        <UnderlineTabs.Content value="link">
          <div class="ui:flex ui:flex-col ui:gap-3 ui:p-1">
            <InputField bind:value={imageUrl} placeholder="https://example.com/image.png" />
            <Button type="button" onclick={handleUrlInsert} class="ui:self-start">Insert</Button>
          </div>
        </UnderlineTabs.Content>
      </UnderlineTabs.Root>
    </div>
  </Dialog.Content>
</Dialog.Root>
