<script lang="ts">
  import { env } from '$env/dynamic/public';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import axios from 'axios';
  import {
    lesson,
    deleteLessonVideo,
    uploadCourseVideoStore,
    cancelVideoUpload
  } from '$lib/components/Course/components/Lesson/store/lessons';
  import { type ComponentProps } from 'svelte';
  import { ProgressBar } from 'carbon-components-svelte';
  import { isFreePlan } from '$lib/utils/store/org';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import UpgradeBanner from '$lib/components/Upgrade/Banner.svelte';
  import { rpc } from '$lib/utils/services/api';
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
  let abortController: AbortController | null = null;

  async function onUpload() {
    if (!fileInput) return;

    // Create new AbortController for this upload
    abortController = new AbortController();

    $uploadCourseVideoStore.isUploading = true;
    $uploadCourseVideoStore.isCancelled = false;

    const videoFile = fileInput.files[0];
    fileSize = videoFile?.size / (1024 * 1024);

    try {
      const uploadPresignResponse = await rpc.course.presign.upload.$post({
        fileName: videoFile.name,
        fileType: videoFile.type
      });
      const uploadPresignResult = await uploadPresignResponse.json();

      if (!uploadPresignResult.success) {
        throw new Error(uploadPresignResult.message);
      }

      const presignedUrl = uploadPresignResponse.url;

      const uploadResponse = await axios.put(presignedUrl, videoFile, {
        headers: {
          'Content-Type': videoFile.type
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        signal: abortController.signal,
        onUploadProgress: (progressEvent) => {
          if ($uploadCourseVideoStore.isCancelled) {
            abortController?.abort();
            return;
          }

          value = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1) / 2);
        }
      });

      const downloadPresignedResponse = await rpc.course.presign.download.$post({
        keys: [uploadPresignResult.fileKey]
      });
      const downloadPresignedResult = await downloadPresignedResponse.json();

      if (!downloadPresignedResult.success) {
        throw new Error(downloadPresignedResult.message);
      }

      const fileKey = uploadPresignResult.fileKey;
      const presignedUrls = downloadPresignedResult.urls;

      formRes = {
        url: presignedUrls[fileKey],
        fileKey: uploadPresignResult.fileKey,
        status: uploadResponse.status
      };

      $lesson.materials.videos = [
        ...$lesson.materials.videos,
        {
          type: 'upload',
          link: formRes.url,
          key: formRes?.fileKey
        }
      ];

      $uploadCourseVideoStore.isUploading = false;
      isLoaded = false;
    } catch (err: any) {
      console.error('Error uploading video', err, '\n\n', err.response);

      if ($uploadCourseVideoStore.isCancelled) {
        formRes = {
          type: 'CANCELLED',
          status: 0,
          message: $t('course.navItem.lessons.materials.tabs.video.add_video.upload_cancelled')
        };
      } else if (err.response) {
        formRes = err.response.data;
      } else {
        let message = 'An error occurred while uploading the video';
        if (err instanceof Error) {
          message = err.message;
        }
        formRes = {
          type: 'INTERNAL_ERROR',
          status: 500,
          message
        };
      }
    } finally {
      abortController = null;
    }

    isLoaded = true;
  }

  function tryAgain() {
    formRes = null;
    isLoaded = false;
    $uploadCourseVideoStore.isUploading = false;
    value = 0;
  }

  function cancelUpload() {
    if (abortController) {
      abortController.abort();
    }
    cancelVideoUpload();
    formRes = null;
    isLoaded = false;
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
          <div class="mt-3">
            <PrimaryButton
              label={$t('course.navItem.lessons.materials.tabs.video.add_video.cancel_upload')}
              variant={VARIANTS.OUTLINED}
              onClick={cancelUpload}
            />
          </div>
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
