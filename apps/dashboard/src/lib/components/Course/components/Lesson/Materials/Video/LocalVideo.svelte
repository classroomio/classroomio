<script lang="ts">
  import axios from 'axios';
  import { env } from '$env/dynamic/public';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import {
    lesson,
    deleteLessonVideo,
    uploadCourseVideoStore
  } from '$lib/components/Course/components/Lesson/store/lessons';
  import { onMount, onDestroy } from 'svelte';
  import { ProgressBar } from 'carbon-components-svelte';
  import { supabase } from '$lib/utils/functions/supabase';
  import { isFreePlan } from '$lib/utils/store/org';
  import UpgradeBanner from '$lib/components/Upgrade/Banner.svelte';

  let value = 0;
  let max = 100;
  let status = 'active';
  let fileSize;
  let isDisabled = false;
  import { t } from '$lib/utils/functions/translations';

  export let lessonId = '';

  let formRes;
  let isLoaded = false;
  let fileInput;
  let submit;
  let uploadedFileUrl = '';
  let isLoading = false;
  let prevProgress = 0;
  let uploadChannel;

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

    fileSize = videoFile?.size / (1024 * 1024);
    try {
      const response = await axios({
        method: 'POST',
        url: env.PUBLIC_SERVER_URL + '/uploadVideo?lessonId=' + lessonId,
        data: formData,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        headers: {
          'Content-Type': 'multipart/form-data; boundary=MyBoundary'
        },
        onUploadProgress: (progressEvent) => {
          value = Math.round((progressEvent.loaded * 100) / progressEvent?.total / 2);
        }
      });

      formRes = response.data;
      console.log('Upload res', formRes);
      isLoading = false;
      isLoaded = false;
    } catch (err: any) {
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

  onMount(async () => {
    uploadChannel = supabase
      .channel('upload-progress')
      .on('broadcast', { event: lessonId }, (payload) => {
        console.log('The progress of the upload', payload);
        value = value + payload?.payload - prevProgress;
        prevProgress = payload.payload;
      })
      .subscribe();
  });

  onDestroy(() => {
    supabase.removeChannel(uploadChannel);
  });

  $: helperText = value + '%  of ' + Math.round(fileSize) + 'MB';
  $: if (value === max) {
    helperText = 'Done';
    status = 'finished';
  }

  $: isDoneUploading(formRes);
  $: isDisabled = isLoading || !env.PUBLIC_SERVER_URL || $isFreePlan;
</script>

<UpgradeBanner className="mb-3" onClick={() => ($uploadCourseVideoStore.isModalOpen = false)}>
  {$t('course.navItem.lessons.materials.tabs.video.add_video.upgrade')}
</UpgradeBanner>

{#if !isLoaded}
  <button
    type="button"
    on:click={() => (fileInput && !isLoading ? fileInput.click() : null)}
    class="h-full w-full {isDisabled && 'hover:cursor-not-allowed opacity-50'}"
    disabled={isDisabled}
  >
    <form
      class="border-primary-300 flex h-full w-full flex-col items-center justify-center rounded-xl border border-dashed"
      on:submit|preventDefault={onUpload}
    >
      {#if isLoading}
        <div class="flex flex-col gap-5 max-w-[500px] w-[60%] justify-center">
          <p class="mt-5 text-center">
            {$t('course.navItem.lessons.materials.tabs.video.add_video.uploading')}
          </p>
          <ProgressBar class="w-full" {value} {max} {status} />
          <p class="text-sm">{helperText}</p>
        </div>
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
        {$t('course.navItem.lessons.materials.tabs.video.add_video.big_file')}<br />
        {$t('course.navItem.lessons.materials.tabs.video.add_video.maximum_size')}
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
        {$t('course.navItem.lessons.materials.tabs.video.add_video.unsupported_format')}<br />
        {$t('course.navItem.lessons.materials.tabs.video.add_video.format')}
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
