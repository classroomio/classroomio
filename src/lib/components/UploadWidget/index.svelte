<script lang="ts">
  import { onMount } from 'svelte';
  import Tabs from '$lib/components/Tabs/index.svelte';
  import { course } from '$lib/components/Course/store';
  import { getSupabase } from '$lib/utils/functions/supabase';
  import TabContent from '$lib/components/TabContent/index.svelte';
  import { updateCourse } from '$lib/utils/services/courses';
  import { snackbar } from '../Snackbar/store';
  import { isObject } from '$lib/utils/functions/isObject';
  import Modal from '$lib/components/Modal/index.svelte';
  import { handleOpenWidget } from '$lib/components/CourseLandingPage/store';
  import { settings } from '../Course/components/Settings/store';
  import { queryUnsplash } from './utils';

  export let selectedImgUrl = '';

  let tabs = [
    { label: 'Unsplash', value: 'unsplash' },
    { label: 'Upload', value: 'upload' }
  ];
  let currentTab = tabs[0].value;
  let searchQuery = '';
  let unsplashImages = [];
  let avatar;
  let fileInput;
  let imagebuffer;

  const supabase = getSupabase();
  const onChange = (tabValue) => {
    currentTab = tabValue;
  };

  async function handleImageClick(imageUrl) {
    selectedImgUrl = imageUrl;
    uploadImage(selectedImgUrl);
  }

  const onFileSelected = () => {
    const image = fileInput.files[0];
    if (image) {
      let reader = new FileReader();
      reader.readAsDataURL(image);
      reader.onload = (e) => {
        imagebuffer = image;
        uploadImage(image);
      };
    }
  };

  const uploadImage = async (image) => {
    if (image) {
      if (typeof image === 'string') {
        $settings.image = image;
      } else if (image instanceof File) {
        const filename = `bannerimage/${Date.now()}` + image.name;
        const { data } = await supabase.storage.from('avatars').upload(filename, image, {
          cacheControl: '3600',
          upsert: false
        });

        if (data) {
          const { data: response } = await supabase.storage.from('avatars').getPublicUrl(filename);

          $settings.image = response.publicUrl;
        }
      }

      try {
        const { image } = $settings;
        await updateCourse($course.id, avatar, {
          logo: image,

          metadata: {
            ...(isObject($course.metadata) ? $course.metadata : {})
          }
        });

        $course.logo = image;
        $course.metadata = {
          ...(isObject($course.metadata) ? $course.metadata : {})
        };
        snackbar.success('Saved successfully');
        $handleOpenWidget.open = false;
      } catch (error) {
        snackbar.error();
        console.log(error);
      }
    }
  };

  function handleUpload() {
    fileInput.click();
  }

  async function handleSubmit() {
    try {
      unsplashImages = await queryUnsplash(searchQuery || 'rocks');
    } catch (error) {
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
          <div class="w-full mt-2">
            <input
              type="file"
              style="display: none;"
              bind:this={fileInput}
              on:change={onFileSelected}
            />
            <button
              on:click={handleUpload}
              class="py-2 w-full font-semibold hover:bg-gray-200 border-[1px]">Upload Image</button
            >
            <p class="text-center text-sm text-gray-500 my-2">
              Images wider than 1500 pixels work best.
            </p>
            <p class="text-center text-sm text-gray-500">The maximum size per file is 5 MB.</p>
          </div>
        </TabContent>
        <TabContent value={tabs[0].value} index={currentTab}>
          <!-- Your Images content here -->
          <div class="h-full py-5 overflow-y-scroll">
            <form on:submit|preventDefault={handleSubmit} class="flex gap-2">
              <input
                type="text"
                bind:value={searchQuery}
                name=""
                id=""
                class="rounded-lg w-[87%] ml-2 dark:text-black"
              />
              <button
                type="submit"
                class="px-3 py-1 bg-white rounded-lg border-[1px] border-gray-500 text-black"
                >Submit</button
              >
            </form>
            {#if unsplashImages && unsplashImages.length > 0}
              <div class="flex flex-row items-center flex-wrap gap-2 py-4 px-[10px] max-h-[300px]">
                {#each unsplashImages as unsplashImages (unsplashImages.id)}
                  <div class="w-[190px] h-[130px] overflow-hidden relative">
                    <img
                      src={unsplashImages.urls.regular}
                      alt={unsplashImages.alt_description}
                      class="w-full h-full object-cover rounded-md hover:opacity-80 cursor-pointer"
                      on:click={() => handleImageClick(unsplashImages.urls.regular)}
                    />
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
