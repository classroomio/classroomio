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
  import { Button } from '@cio/ui/base/button';

  interface Props {
    imageURL?: string;
    onchange?: (_v: string) => void;
  }

  let { imageURL = $bindable(''), onchange }: Props = $props();

  const tabs = [
    { label: 'Unsplash', value: 'unsplash' },
    { label: 'Upload', value: 'upload' }
  ];

  let isUploading = $state(false);
  let currentTab = $state(tabs[0].value);
  let searchQuery = $state('');
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
  let fileInput: HTMLInputElement | undefined = $state();

  let label = $state($t('snackbar.landing_page_settings.error.label'));

  async function handleImageClick(img: string) {
    $handleOpenWidget.open = false;

    onchange?.(img);
    imageURL = img;
  }

  const onFileSelected = () => {
    const file = fileInput?.files?.[0];
    const sizeInkb = file?.size! / 1024;
    if (sizeInkb > 500) {
      snackbar.error('snackbar.landing_page_settings.error.file_size');
      label = $t('snackbar.landing_page_settings.error.try_again');
      return;
    }
    if (file) {
      let reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        handleUploadImage(file);
      };
    }
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

  function handleUpload() {
    fileInput?.click();
  }

  async function handleSubmit() {
    try {
      unsplashImages = await queryUnsplash(searchQuery || 'rocks');
    } catch (error) {
      snackbar.error('snackbar.landing_page_settings.error.fetch_error');
      console.error('Error fetching images from Unsplash:', error);
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
  <Dialog.Content class="w-3/5">
    <Dialog.Header>
      <Dialog.Title>{$t('course.navItem.landing_page.upload_widget.title')}</Dialog.Title>
    </Dialog.Header>
    <div class="w-full bg-white p-5 dark:bg-inherit">
    <UnderlineTabs.Root bind:value={currentTab}>
      <UnderlineTabs.List>
        {#each tabs as tab}
          <UnderlineTabs.Trigger value={tab.value}>
            {tab.label}
          </UnderlineTabs.Trigger>
        {/each}
      </UnderlineTabs.List>
      <UnderlineTabs.Content value={tabs[1].value}>
        <!-- Your Upload content here -->
        <div class="w-full">
          <input
            type="file"
            style="display: none;"
            bind:this={fileInput}
            onchange={onFileSelected}
            disabled={isUploading}
          />
          <Button onclick={handleUpload} loading={isUploading}>
            {label}
          </Button>
          <p class="my-2 text-center text-sm text-gray-500">
            {$t('course.navItem.landing_page.upload_widget.width')}
          </p>
          <p class="text-center text-sm text-gray-500">
            {$t('course.navItem.landing_page.upload_widget.size')}
          </p>
        </div>
      </UnderlineTabs.Content>
      <UnderlineTabs.Content value={tabs[0].value}>
        <!-- Your Images content here -->
        <div class="h-full overflow-y-scroll">
          <form onsubmit={preventDefault(handleSubmit)} class="mt-1 flex gap-2 pb-3">
            <input type="text" bind:value={searchQuery} name="" id="" class="ml-2 w-[85%] rounded-lg dark:text-black" />
            <button type="submit" class="rounded-lg border border-gray-500 bg-white px-3 py-1 text-black"
              >{$t('course.navItem.landing_page.upload_widget.submit')}</button
            >
          </form>
          {#if unsplashImages && unsplashImages.length > 0}
            <div class="hide-scrollbar flex max-h-[300px] flex-row flex-wrap items-center gap-2 px-[10px]">
              {#each unsplashImages as unsplashImages (unsplashImages.id)}
                <div>
                  <div class="relative h-[130px] w-[195px] overflow-hidden">
                    <button onclick={() => handleImageClick(unsplashImages.urls.regular)}>
                      <img
                        src={unsplashImages.urls.regular}
                        alt={unsplashImages.alt_description}
                        class="h-full w-full cursor-pointer rounded-md object-cover hover:opacity-80"
                      />
                    </button>
                  </div>
                  {#if unsplashImages.user.name}
                    <p class="mt-1 text-center text-xs font-light text-gray-500">
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
