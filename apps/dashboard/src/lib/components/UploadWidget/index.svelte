<script lang="ts">
  import { onMount } from 'svelte';
  import Tabs from '$lib/components/Tabs/index.svelte';
  import { getSupabase } from '$lib/utils/functions/supabase';
  import TabContent from '$lib/components/TabContent/index.svelte';
  import { snackbar } from '../Snackbar/store';
  import Modal from '$lib/components/Modal/index.svelte';
  import { handleOpenWidget } from '$lib/components/CourseLandingPage/store';
  import { queryUnsplash } from './utils';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';

  export let imageURL = '';

  const supabase = getSupabase();
  const tabs = [
    { label: 'Unsplash', value: 'unsplash' },
    { label: 'Upload', value: 'upload' }
  ];

  let isUploading = false;
  let currentTab = tabs[0].value;
  let searchQuery = '';
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
  }[] = [];
  let fileInput: HTMLInputElement;

  let label = "Upload Image"

  const onChange = (tabValue: string) => () => (currentTab = tabValue);

  async function handleImageClick(img: string) {
    imageURL = img;
    $handleOpenWidget.open = false;
  }

  const onFileSelected = () => {
    const file = fileInput?.files?.[0];
    const sizeInkb = file?.size! / 1024;
    if (sizeInkb > 500){
      snackbar.error("File Size must not be greater than 500kb")
      label = "Try Again"
      return;
    }
    if (file) {
      let reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        uploadImage(file);
      };
    }
  };

  const uploadImage = async (image: File) => {
    isUploading = true;
    if (!image) {
      return;
    }
    const filename = `uploadwidget/${Date.now()}` + image.name;
    const { data } = await supabase.storage.from('avatars').upload(filename, image, {
      cacheControl: '3600',
      upsert: false
    });

    if (data) {
      const { data: response } = await supabase.storage.from('avatars').getPublicUrl(filename);
      imageURL = response.publicUrl;
    }
    isUploading = false;

    snackbar.success(`Complete :)`);
    $handleOpenWidget.open = false;
  };

  function handleUpload() {
    fileInput.click();
  }

  async function handleSubmit() {
    try {
      unsplashImages = await queryUnsplash(searchQuery || 'rocks');
    } catch (error) {
      snackbar.error('Error fetching images from Unsplash');
      console.error('Error fetching images from Unsplash:', error);
    }
  }

  onMount(handleSubmit);
</script>

<Modal
  onClose={() => ($handleOpenWidget.open = false)}
  bind:open={$handleOpenWidget.open}
  width="w-3/5"
  maxWidth=""
  modalHeading="Banner Widget"
>
  <div class="w-full bg-white dark:bg-inherit p-5">
    <Tabs {tabs} {currentTab} {onChange}>
      <slot:fragment slot="content">
        <TabContent value={tabs[1].value} index={currentTab}>
          <!-- Your Upload content here -->
          <div class="w-full">
            <input
              type="file"
              style="display: none;"
              bind:this={fileInput}
              on:change={onFileSelected}
              disabled={isUploading}
            />
            <PrimaryButton
              label={label}
              onClick={handleUpload}
              isLoading={isUploading}
              className="w-full font-semibold m-auto"
            />
            <p class="text-center text-sm text-gray-500 my-2">
              Images wider than 1500 pixels work best.
            </p>
            <p class="text-center text-sm text-gray-500">The maximum size per file is 500kb.</p>
          </div>
        </TabContent>
        <TabContent value={tabs[0].value} index={currentTab}>
          <!-- Your Images content here -->
          <div class="h-full overflow-y-scroll">
            <form on:submit|preventDefault={handleSubmit} class="flex gap-2 pb-3 mt-1">
              <input
                type="text"
                bind:value={searchQuery}
                name=""
                id=""
                class="rounded-lg w-[85%] ml-2 dark:text-black"
              />
              <button
                type="submit"
                class="px-3 py-1 bg-white rounded-lg border-[1px] border-gray-500 text-black"
                >Submit</button
              >
            </form>
            {#if unsplashImages && unsplashImages.length > 0}
              <div
                class="flex flex-row items-center flex-wrap gap-2 px-[10px] max-h-[300px] hide-scrollbar"
              >
                {#each unsplashImages as unsplashImages (unsplashImages.id)}
                  <div>
                    <div class="w-[195px] h-[130px] overflow-hidden relative">
                      <button on:click={() => handleImageClick(unsplashImages.urls.regular)}>
                        <img
                          src={unsplashImages.urls.regular}
                          alt={unsplashImages.alt_description}
                          class="w-full h-full object-cover rounded-md hover:opacity-80 cursor-pointer"
                        />
                      </button>
                    </div>
                    {#if unsplashImages.user.name}
                      <p class="text-center text-xs mt-1 text-gray-500 font-light">
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
              <p class="text-center pt-7">No images available.</p>
            {/if}
          </div>
        </TabContent>
      </slot:fragment>
    </Tabs>
  </div>
</Modal>

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
