<script>
  import axios from 'axios';
  import { PUBLIC_SERVER_URL } from '$env/static/public';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import {
    lesson,
    deleteLessonVideo,
    uploadCourseVideoStore
  } from '$lib/components/Course/components/Lesson/store/lessons';
  import { Moon } from 'svelte-loading-spinners';
  import { t } from '$lib/utils/functions/translations';

  export let lessonId = '';

  let formRes;
  let isLoaded = false;
  let fileInput;
  let submit;
  let uploadedFileUrl = '';
  let isLoading = false;
  let timeoutkey;

  const uploadingTexts = [
    'Sending your video to our server...',
    'Breaking video into chunks',
    'Compressing the video...',
    'Generating a link to your video...',
    'Wrapping things up'
  ];
  let uploadingLoadingText = uploadingTexts[0];

  function isVideoAdded(link) {
    return $lesson.materials?.videos?.find((v) => v.link === link);
  }

  async function onUpload(e) {
    isLoading = true;
    if (!fileInput) return;

    const formData = new FormData();
    const videoFile = fileInput.files[0];
    formData.append('videoFile', videoFile);

    console.log({ size: videoFile?.size });

    try {
      const response = await axios({
        method: 'POST',
        url: PUBLIC_SERVER_URL + '/uploadVideo?lessonId=' + lessonId,
        data: formData,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        headers: {
          'Content-Type': 'multipart/form-data; boundary=MyBoundary'
        }
      });

      formRes = response.data;
      console.log('Upload res', formRes);
      isLoading = false;
      isLoaded = false;
    } catch (err) {
      console.error('Error uploading video', err, '\n\n', err.response);
      if (err.response) {
        formRes = err.response.data;
        console.log('formRes', formRes);
      }
    }

    isLoaded = true;
  }

  async function isDoneUploading(response) {
    uploadedFileUrl = response?.success && response?.url;

    if (uploadedFileUrl && !isVideoAdded(uploadedFileUrl)) {
      $lesson.materials.videos = [
        ...$lesson.materials.videos,
        {
          type: 'muse',
          link: uploadedFileUrl,
          metadata: response?.metadata || {}
        }
      ];
    }
  }

  function tryAgain() {
    formRes = null;
    isLoaded = false;
    isLoading = false;
  }

  $: {
    if (isLoading) {
      timeoutkey = setTimeout(() => {
        console.log('timeout');
        const i = uploadingTexts.findIndex((text) => text === uploadingLoadingText);
        const next = uploadingTexts[i + 1];

        if (next) {
          console.log('uploadingLoadingText', next);
          uploadingLoadingText = next;
        }
      }, 30000);
    } else if (timeoutkey) {
      console.log('clearTimeout');
      clearTimeout(timeoutkey);
      uploadingLoadingText = uploadingTexts[0];
    }
  }

  $: isDoneUploading(formRes);
</script>

{#if !isLoaded}
  <button
    type="button"
    on:click={() => (fileInput && !isLoading ? fileInput.click() : null)}
    class="h-full w-full"
    disabled={isLoading || !PUBLIC_SERVER_URL}
  >
    <form
      class="border-primary-300 flex h-full w-full flex-col items-center justify-center rounded-xl border border-dashed"
      on:submit|preventDefault={onUpload}
    >
      {#if isLoading}
        <Moon size="40" color="#1d4ed8" unit="px" duration="1s" />
        <p class="mt-5">{uploadingLoadingText}</p>
      {:else}
        <img src="/upload-video.svg" alt="upload" />
        <span class="pt-3">
          <h3 class="text-center text-xl font-normal dark:text-white">
            {$t('course.navItem.lessons.materials.tabs.video.add_video.upload_video')}
          </h3>
          <p class=" text-center text-sm font-normal">
            {$t('course.navItem.lessons.materials.tabs.video.add_video.select_file')}
          </p>
          <p>{$t('course.navItem.lessons.materials.tabs.video.add_video.size')}</p>
        </span>
      {/if}
      <input
        style="display:none;"
        type="file"
        accept="video/*"
        name="videoFile"
        on:change={() => submit.click()}
        bind:this={fileInput}
      />
      <input type="text" name="lessonId" value={lessonId} style="display: none;" />
      <input style="display:none;" type="submit" bind:this={submit} />
    </form>
  </button>
{:else if formRes?.type === 'FILE_TOO_LARGE'}
  <div class="flex h-full w-full flex-col items-center justify-center rounded-xl">
    <img src="/video-upload-error.svg" alt="upload error" />
    <span class="pb-2 pt-3">
      <h3 class="text-center text-base font-normal dark:text-white">
        {$t('course.navItem.lessons.materials.tabs.video.add_video.oops')}
      </h3>
      <p class="text-center text-xs font-normal text-[#ADADAD]">
        {$t('course.navItem.lessons.materials.tabs.video.add_video.sorry')}<br />
        {$t('course.navItem.lessons.materials.tabs.video.add_video.sorry_2')}
      </p>
    </span>
    <PrimaryButton
      label={$t('course.navItem.lessons.materials.tabs.video.add_video.button')}
      onClick={tryAgain}
    />
  </div>
{:else if !formRes?.success}
  <div class="flex h-full w-full flex-col items-center justify-center rounded-xl">
    <img src="/video-upload-error.svg" alt="upload error" />
    <span class="pb-2 pt-3">
      <h3 class="text-center text-base font-normal dark:text-white">
        {$t('course.navItem.lessons.materials.tabs.video.add_video.oops')}
      </h3>
      <p class="text-center text-xs font-normal text-[#ADADAD]">
        {$t('course.navItem.lessons.materials.tabs.video.add_video.sorry_3')}<br />
        {$t('course.navItem.lessons.materials.tabs.video.add_video.sorry_4')}
      </p>
    </span>
    <PrimaryButton
      label={$t('course.navItem.lessons.materials.tabs.video.add_video.try_again')}
      onClick={tryAgain}
    />
  </div>
{:else}
  <div class="flex h-full w-full flex-col items-start justify-between">
    <div class="h-auto w-full rounded-md border px-8 py-3">
      <div class="flex items-center justify-between">
        <span class="flex items-center gap-2">
          <div class="overflow-hidden rounded-sm">
            <video class="w-[200px]">
              <source src={uploadedFileUrl} type="video/mp4" />
              <!-- <source src="/path/to/video.webm" type="video/webm" /> -->
              <!-- Captions are optional -->
              <track kind="captions" />
            </video>
          </div>
          <p>{fileInput?.files?.[0]?.name || uploadedFileUrl}</p>
        </span>
        <button on:click={deleteLessonVideo}>
          <img src="/delete-video.svg" alt="deletevideo" class="dark:invert" />
        </button>
      </div>
      <PrimaryButton
        label={$t('course.navItem.lessons.materials.button_done')}
        onClick={() => ($uploadCourseVideoStore.isModalOpen = false)}
      />
    </div>
  </div>
{/if}
