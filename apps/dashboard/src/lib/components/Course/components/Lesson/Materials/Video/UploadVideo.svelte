<script lang="ts">
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import {
    lesson,
    lessonVideoUpload,
    cancelVideoUpload
  } from '$lib/components/Course/components/Lesson/store/lessons';
  import { ProgressBar } from 'carbon-components-svelte';
  import { isFreePlan } from '$lib/utils/store/org';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import UpgradeBanner from '$lib/components/Upgrade/Banner.svelte';
  import { t } from '$lib/utils/functions/translations';

  import { VideoUploader } from '$lib/utils/services/courses/presign';

  export let lessonId = '';

  let fileSize;
  let isDisabled = false;

  let formRes;
  let isLoaded = false;
  let fileInput;
  let submit;
  let fileName = '';

  const videoUploader = new VideoUploader();

  async function onUpload() {
    if (!fileInput) return;

    videoUploader.initUpload();

    const videoFile = fileInput.files[0];
    fileSize = videoFile?.size / (1024 * 1024);
    fileName = videoFile?.name;

    try {
      const { url: presignedUrl, fileKey } = await videoUploader.getPresignedUrl(videoFile);

      await videoUploader.uploadFile({
        url: presignedUrl,
        file: videoFile
      });

      const { urls: presignedUrls } = await videoUploader.getDownloadPresignedUrl([fileKey]);

      formRes = {
        url: presignedUrls[fileKey],
        fileKey: fileKey,
        status: 200
      };

      $lesson.materials.videos = [
        ...$lesson.materials.videos,
        {
          type: 'upload',
          link: formRes.url,
          key: formRes?.fileKey
        }
      ];

      isLoaded = false;
    } catch (err: any) {
      console.error('Error uploading video', err, '\n\n', err.response);

      if ($lessonVideoUpload.isCancelled) {
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
      videoUploader.abortController = null;
    }

    isLoaded = true;
    $lessonVideoUpload.isUploading = false;
  }

  function tryAgain() {
    formRes = null;
    isLoaded = false;
    $lessonVideoUpload.isUploading = false;
    $lessonVideoUpload.uploadProgress = 0;
  }

  function cancelUpload() {
    videoUploader.abortController?.abort();

    cancelVideoUpload();

    formRes = null;
    isLoaded = false;
    $lessonVideoUpload.uploadProgress = 0;
  }

  $: helperText = $lessonVideoUpload.uploadProgress + '%  of ' + Math.round(fileSize) + 'MB';

  $: isDisabled = $lessonVideoUpload.isUploading || $isFreePlan;
</script>

<UpgradeBanner className="mb-3" onClick={() => ($lessonVideoUpload.isModalOpen = false)}>
  {$t('course.navItem.lessons.materials.tabs.video.add_video.upgrade')}
</UpgradeBanner>

{#if !isLoaded}
  <button
    type="button"
    on:click={() => (fileInput && !$lessonVideoUpload.isUploading ? fileInput.click() : null)}
    class="h-full w-full {isDisabled && 'opacity-50 hover:cursor-not-allowed'}"
    disabled={isDisabled}
  >
    <form
      class="border-primary-300 flex h-full w-full flex-col items-center justify-center rounded-xl border border-dashed"
      on:submit|preventDefault={onUpload}
    >
      {#if $lessonVideoUpload.isUploading}
        <div class="flex w-[60%] max-w-[500px] flex-col justify-center gap-5">
          <p class="mt-5 text-center">
            {$t('course.navItem.lessons.materials.tabs.video.add_video.uploading')}
          </p>
          <ProgressBar
            class="w-full"
            value={$lessonVideoUpload.uploadProgress}
            max={100}
            status={$lessonVideoUpload.uploadProgress === 100 ? 'finished' : 'active'}
          />
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
  <div class=" w-full rounded-md border px-8 py-3">
    <div class="flex flex-col items-center gap-8">
      <div class="flex flex-col items-center gap-2">
        <video class="border-primary-300 w-[200px] rounded-md border">
          <source src={formRes.url} type="video/mp4" />
          <track kind="captions" />
          <p>{$t('generic.loading')}</p>
        </video>
        <p>{fileInput?.files?.[0]?.name || fileName}</p>
      </div>
      <PrimaryButton
        label={$t('course.navItem.lessons.materials.button_done')}
        onClick={() => ($lessonVideoUpload.isModalOpen = false)}
      />
    </div>
  </div>
{/if}
