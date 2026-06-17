<script lang="ts">
  import { preventDefault } from '$lib/utils/functions/svelte';

  import { onMount } from 'svelte';
  import * as UnderlineTabs from '@cio/ui/custom/underline-tabs';
  import { snackbar } from '$features/ui/snackbar/store';
  import * as Dialog from '@cio/ui/base/dialog';
  import { handleOpenWidget } from '$features/ui/course-landing-page/store';
  import { queryUnsplash } from './utils';

  import { t } from '$lib/utils/functions/translations';
  import { uploadImage } from '$lib/utils/services/upload';
  import * as ImageCropper from '@cio/ui/custom/image-cropper';
  import { InputField } from '@cio/ui/custom/input-field';
  import { Button } from '@cio/ui/base/button';
  import UploadCloudIcon from '@lucide/svelte/icons/upload-cloud';

  interface Props {
    imageURL?: string;
    onchange?: (_v: string) => void;
  }

  let { imageURL = $bindable(''), onchange }: Props = $props();

  const tabs = [
    { label: 'Upload', value: 'upload' },
    { label: 'Unsplash', value: 'unsplash' }
  ];

  // Course cover preview is rendered in a 280×200 frame, so crop uploads to
  // that ratio instead of storing the raw image and letting CSS squeeze it.
  const COVER_ASPECT = 280 / 200;

  let isUploading = $state(false);
  let isSearching = $state(false);
  let currentTab = $state(tabs[0].value);
  let searchQuery = $state('');
  let cropperSrc = $state('');
  let unsplashImages: {
    id: string | number;
    user: {
      name: string;
      username: string;
    };
    urls: {
      regular: string;
    };
    alt_description: string;
  }[] = $state([]);

  const MAX_IMAGE_SIZE = 500 * 1000;

  async function handleImageClick(img: string) {
    onchange?.(img);
    imageURL = img;

    $handleOpenWidget.open = false;
  }

  function handleUnsupportedFile(file: File) {
    if (file.size > MAX_IMAGE_SIZE) {
      snackbar.error('snackbar.landing_page_settings.error.file_size');
      return;
    }

    snackbar.error('snackbar.landing_page_settings.error.file_size');
  }

  const handleCropped = async (croppedUrl: string) => {
    const response = await fetch(croppedUrl);
    const blob = await response.blob();
    const file = new File([blob], 'course-cover.png', { type: blob.type });

    await handleUploadImage(file);
  };

  const handleUploadImage = async (image: File) => {
    isUploading = true;
    if (!image) {
      return;
    }

    imageURL = await uploadImage(image);

    onchange?.(imageURL);
    isUploading = false;

    snackbar.success(`snackbar.landing_page_settings.success.complete`);
    $handleOpenWidget.open = false;
  };

  async function handleSubmit() {
    isSearching = true;

    try {
      unsplashImages = await queryUnsplash(searchQuery || 'nature landscape architecture');
    } catch (error) {
      snackbar.error('snackbar.landing_page_settings.error.fetch_error');
      console.error('Error fetching images from Unsplash:', error);
    } finally {
      isSearching = false;
    }
  }

  onMount(handleSubmit);
</script>

<Dialog.Root
  bind:open={$handleOpenWidget.open}
  onOpenChange={(isOpen) => {
    if (!isOpen) $handleOpenWidget.open = false;
  }}
>
  <Dialog.Content class="ui:z-300! w-[95%] max-w-2xl!">
    <Dialog.Header>
      <Dialog.Title>{$t('course.navItem.landing_page.upload_widget.title')}</Dialog.Title>
    </Dialog.Header>
    <div class="w-full bg-white p-2 dark:bg-inherit">
      <UnderlineTabs.Root bind:value={currentTab}>
        <UnderlineTabs.List>
          {#each tabs as tab}
            <UnderlineTabs.Trigger value={tab.value}>
              {tab.label}
            </UnderlineTabs.Trigger>
          {/each}
        </UnderlineTabs.List>
        <UnderlineTabs.Content value="upload">
          <div class="w-full {isUploading ? 'ui:opacity-50 ui:pointer-events-none' : ''}">
            <ImageCropper.Root
              bind:src={cropperSrc}
              onCropped={handleCropped}
              onUnsupportedFile={handleUnsupportedFile}
              maxFileSize={MAX_IMAGE_SIZE}
              accept=".jpg, .jpeg, .png, .webp"
              disabled={isUploading}
            >
              <ImageCropper.UploadTrigger
                class="ui:flex ui:w-full ui:flex-col ui:items-center ui:justify-center ui:gap-2 ui:rounded-lg ui:border-2 ui:border-dashed ui:border-input ui:bg-muted/30 ui:px-6 ui:py-10 ui:text-center ui:transition-colors ui:hover:bg-muted/60"
              >
                <UploadCloudIcon class="ui:text-muted-foreground" size={28} />
                <p class="ui:m-0 ui:text-sm ui:font-medium">
                  {$t('course.navItem.landing_page.upload_widget.drag_drop')}
                </p>
                <p class="ui:m-0 ui:text-xs ui:text-muted-foreground">
                  {$t('course.navItem.landing_page.upload_widget.size')}
                </p>
              </ImageCropper.UploadTrigger>

              <ImageCropper.Dialog class="ui:z-[400]!">
                <ImageCropper.Cropper cropShape="rect" aspect={COVER_ASPECT} />
                <ImageCropper.Controls>
                  <ImageCropper.Cancel />
                  <ImageCropper.Crop />
                </ImageCropper.Controls>
              </ImageCropper.Dialog>
            </ImageCropper.Root>
          </div>
        </UnderlineTabs.Content>
        <UnderlineTabs.Content value="unsplash">
          <!-- Your Images content here -->
          <div class="h-full overflow-y-scroll">
            <form onsubmit={preventDefault(handleSubmit)} class="mt-1 flex gap-2 pb-3">
              <InputField className="ml-2 w-[85%]" bind:value={searchQuery} />
              <Button type="submit" variant="outline" loading={isSearching}>
                {$t('course.navItem.landing_page.upload_widget.submit')}
              </Button>
            </form>
            {#if unsplashImages && unsplashImages.length > 0}
              <div class="hide-scrollbar grid max-h-[400px] grid-cols-4 gap-3 px-[10px]">
                {#each unsplashImages as unsplashImages (unsplashImages.id)}
                  <div>
                    <div class="relative aspect-[3/2] overflow-hidden">
                      <button onclick={() => handleImageClick(unsplashImages.urls.regular)}>
                        <img
                          src={unsplashImages.urls.regular}
                          alt={unsplashImages.alt_description}
                          class="h-full w-full cursor-pointer rounded-md object-cover hover:opacity-80"
                        />
                      </button>
                    </div>
                    {#if unsplashImages.user.name}
                      <p class="mt-1 truncate text-center text-xs font-light text-gray-500">
                        By <a
                          href={`https://unsplash.com/@${unsplashImages.user.username}`}
                          target="_blank"
                          class="hover:text-red-700">{unsplashImages.user.name}</a
                        >
                      </p>
                    {/if}
                  </div>
                {/each}
              </div>
            {:else}
              <p class="pt-7 text-center">
                {$t('course.navItem.landing_page.upload_widget.no_images')}
              </p>
            {/if}
          </div>
        </UnderlineTabs.Content>
      </UnderlineTabs.Root>
    </div>
  </Dialog.Content>
</Dialog.Root>

<style>
  .hide-scrollbar {
    width: 100%;
    overflow: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .hide-scrollbar::-webkit-scrollbar {
    width: 0;
    background: transparent;
  }
</style>
