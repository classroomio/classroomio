<script lang="ts">
  import { env } from '$env/dynamic/public';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import axios from 'axios';
  import {
    lesson,
    deleteLessonVideo,
    uploadCourseVideoStore
  } from '$lib/components/Course/components/Lesson/store/lessons';
  import { type ComponentProps } from 'svelte';
  import { ProgressBar } from 'carbon-components-svelte';
  import { isFreePlan } from '$lib/utils/store/org';
  import UpgradeBanner from '$lib/components/Upgrade/Banner.svelte';
  import { apiClient } from '$lib/utils/services/api';
  import { t } from '$lib/utils/functions/translations';

  export let lessonId = '';

  let value = 0;
  let max = 100;
  let status: ComponentProps<ProgressBar>['status'] = 'active';
  let fileSize;
  let isDisabled = false;

  let formRes;
  let isLoaded = false;
  let fileInput;
  let submit;
  let fileName = '';

  async function onUpload() {
    if (!fileInput) return;

    $uploadCourseVideoStore.isUploading = true;

    const videoFile = fileInput.files[0];
    fileSize = videoFile?.size / (1024 * 1024);

    try {
      const uploadPresignResponse = await apiClient.post('/course/presign/upload', {
        fileName: videoFile.name,
        fileType: videoFile.type
      });

      const presignedUrl = uploadPresignResponse.data.url;

      const uploadResponse = await axios.put(presignedUrl, videoFile, {
        headers: {
          'Content-Type': videoFile.type
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        onUploadProgress: (progressEvent) => {
          value = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1) / 2);
        }
      });

      const downloadPresignedResponse = await apiClient.post('/course/presign/download', {
        keys: [uploadPresignResponse.data.fileKey]
      });

      if (!downloadPresignedResponse.data.success) {
        formRes = {
          type: 'INTERNAL_ERROR',
          status: 500,
          message: downloadPresignedResponse.data.message
        };

        return;
      }

      const fileKey = uploadPresignResponse.data.fileKey;
      const presignedUrls = downloadPresignedResponse.data.urls;

      formRes = {
        url: presignedUrls[fileKey],
        fileKey: uploadPresignResponse.data.fileKey,
        status: uploadResponse.status
      };

      console.log('formRes', formRes);

      $lesson.materials.videos = [
        ...$lesson.materials.videos,
        {
          type: 'upload',
          link: formRes.url,
          key: formRes?.fileKey
        }
      ];

      console.log('Upload res', uploadResponse, 'formRes', formRes);
      $uploadCourseVideoStore.isUploading = false;
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

  function tryAgain() {
    formRes = null;
    isLoaded = false;
    $uploadCourseVideoStore.isUploading = false;
    value = 0;
  }

  $: helperText = value + '%  of ' + Math.round(fileSize) + 'MB';
  $: if (value === max) {
    helperText = 'Done';
    status = 'finished';
  }

  $: isDisabled = $uploadCourseVideoStore.isUploading || !env.PUBLIC_SERVER_URL || $isFreePlan;
</script>

<UpgradeBanner className="mb-3" onClick={() => ($uploadCourseVideoStore.isModalOpen = false)}>
  {$t('course.navItem.lessons.materials.tabs.video.add_video.upgrade')}
</UpgradeBanner>

{#if !isLoaded}
  <button
    type="button"
    on:click={() => (fileInput && !$uploadCourseVideoStore.isUploading ? fileInput.click() : null)}
    class="h-full w-full {isDisabled && 'opacity-50 hover:cursor-not-allowed'}"
    disabled={isDisabled}
  >
    <form
      class="border-primary-300 flex h-full w-full flex-col items-center justify-center rounded-xl border border-dashed"
      on:submit|preventDefault={onUpload}
    >
      {#if $uploadCourseVideoStore.isUploading}
        <div class="flex w-[60%] max-w-[500px] flex-col justify-center gap-5">
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
{:else if formRes?.status !== 200}
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
              <source src={formRes.url} type="video/mp4" />
              <track kind="captions" />
            </video>
          </div>
          <p>{fileInput?.files?.[0]?.name || fileName}</p>
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
