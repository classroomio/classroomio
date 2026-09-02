<script lang="ts">
  import type { Editor } from '@tiptap/core';
  import * as Dialog from '$src/base/dialog';
  import * as UnderlineTabs from '../../../underline-tabs';
  import * as ImageCropper from '../../../image-cropper';
  import { Button } from '$src/base/button';
  import { InputField } from '../../../input-field';
  import UploadCloudIcon from '@lucide/svelte/icons/upload-cloud';
  import LoaderCircle from '@lucide/svelte/icons/loader-circle';
  import SearchIcon from '@lucide/svelte/icons/search';

  interface UnsplashPhoto {
    id: string | number;
    user: { name: string; username: string };
    urls: { regular: string };
    alt_description: string;
  }

  interface Props {
    editor?: Editor;
    open?: boolean;
    onImageUpload?: (file: File) => Promise<string>;
    onSearchUnsplash?: (query: string) => Promise<UnsplashPhoto[]>;
    onImageSelect?: (url: string) => void;
    cropAspect?: number;
  }

  let { editor, open = $bindable(false), onImageUpload, onSearchUnsplash, onImageSelect, cropAspect }: Props = $props();

  const tabs = $derived([
    ...(onImageUpload ? [{ label: 'Upload', value: 'upload' }] : []),
    ...(onSearchUnsplash ? [{ label: 'Unsplash', value: 'unsplash' }] : []),
    { label: 'Link', value: 'link' }
  ]);

  let currentTab = $state(tabs[0].value);
  let cropperSrc = $state('');
  let isUploading = $state(false);

  let imageUrl = $state('');

  let searchQuery = $state('');
  let isSearching = $state(false);
  let unsplashImages: UnsplashPhoto[] = $state([]);

  function handleImageSelect(src: string) {
    if (!src) return;
    if (onImageSelect) {
      onImageSelect(src);
    } else if (editor && !editor.isDestroyed) {
      editor.chain().focus().setImage({ src }).run();
    }
    open = false;
  }

  async function handleCropped(croppedUrl: string) {
    if (!onImageUpload) return;
    try {
      isUploading = true;
      const file = await ImageCropper.getFileFromUrl(croppedUrl);
      const url = await onImageUpload(file);
      if (url) handleImageSelect(url);
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
    if (imageUrl.trim()) handleImageSelect(imageUrl.trim());
  }

  async function handleUnsplashSearch() {
    if (!onSearchUnsplash) return;
    isSearching = true;
    try {
      unsplashImages = await onSearchUnsplash(searchQuery || 'nature landscape architecture');
    } catch (error) {
      console.error('Error fetching images from Unsplash:', error);
    } finally {
      isSearching = false;
    }
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
                  <ImageCropper.Cropper cropShape="rect" {...cropAspect ? { aspect: cropAspect } : {}} />
                  <ImageCropper.Controls>
                    <ImageCropper.Cancel />
                    <ImageCropper.Crop />
                  </ImageCropper.Controls>
                </ImageCropper.Dialog>
              </ImageCropper.Root>
            </div>
          </UnderlineTabs.Content>
        {/if}

        {#if onSearchUnsplash}
          <UnderlineTabs.Content value="unsplash">
            <div class="ui:h-full ui:overflow-y-auto">
              <form
                onsubmit={(e) => {
                  e.preventDefault();
                  handleUnsplashSearch();
                }}
                class="ui:mt-1 ui:flex ui:gap-2 ui:pb-3"
              >
                <div class="ui:flex-1">
                  <InputField bind:value={searchQuery} placeholder="Search images on Unsplash..." />
                </div>
                <Button type="submit" variant="outline" loading={isSearching}>
                  <SearchIcon size={16} />
                </Button>
              </form>
              {#if unsplashImages.length > 0}
                <div class="ui:grid ui:max-h-[400px] ui:grid-cols-4 ui:gap-3 ui:overflow-y-auto ui:p-1">
                  {#each unsplashImages as photo (photo.id)}
                    <div>
                      <button
                        type="button"
                        onclick={() => handleImageSelect(photo.urls.regular)}
                        class="ui:group ui:relative ui:aspect-[3/2] ui:overflow-hidden ui:rounded-md"
                      >
                        <img
                          src={photo.urls.regular}
                          alt={photo.alt_description}
                          class="ui:h-full ui:w-full ui:object-cover ui:transition-opacity ui:group-hover:opacity-80"
                        />
                      </button>
                      {#if photo.user?.name}
                        <p class="ui:mt-1 ui:truncate ui:text-center ui:text-xs ui:font-light ui:text-muted-foreground">
                          By
                          <a
                            href="https://unsplash.com/@{photo.user.username}"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="ui:hover:text-primary ui:underline">{photo.user.name}</a
                          >
                        </p>
                      {/if}
                    </div>
                  {/each}
                </div>
              {:else if !isSearching}
                <p class="ui:py-7 ui:text-center ui:text-sm ui:text-muted-foreground">Search for images on Unsplash</p>
              {/if}
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
