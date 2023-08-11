<script>
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import {
    lesson,
    deleteLessonVideo,
    uploadCourseVideoStore
  } from '$lib/components/Course/components/Lesson/store/lessons';
  import { enhance } from '$app/forms';
  import { Moon } from 'svelte-loading-spinners';

  export let lessonId = '';
  export let saveLesson = () => {};

  let isWrongFormat = false;
  let isUploaded = false;
  let isLoaded = false;
  let isBig = false;
  let fileInput;
  let submit;
  let uploadedFileUrl = '';
  let isLoading = false;

  function isVideoAdded(link) {
    return $lesson.materials?.videos?.find((v) => v.link === link);
  }

  async function isDoneUploading(response) {
    uploadedFileUrl = response?.success && response?.url;

    if (uploadedFileUrl && !isVideoAdded(uploadedFileUrl)) {
      $lesson.materials.videos = [
        ...$lesson.materials.videos,
        {
          type: 'muse',
          link: uploadedFileUrl,
          metadata: {}
        }
      ];
      saveLesson();
    }
  }

  $: isDoneUploading($uploadCourseVideoStore.formRes);
</script>

{#if isLoaded === false}
  <button
    type="button"
    on:click={() => (fileInput && !isLoading ? fileInput.click() : null)}
    class="w-full h-full"
    disabled={isLoading}
  >
    <form
      class="h-full w-full flex flex-col items-center justify-center border border-blue-300 border-dashed rounded-xl"
      method="POST"
      action="?/create"
      enctype="multipart/form-data"
      use:enhance={() => {
        isLoading = true;

        return async ({ update }) => {
          await update();
          isLoading = false;
          isLoaded = true;
        };
      }}
    >
      {#if isLoading}
        <Moon size="40" color="#1d4ed8" unit="px" duration="1s" />
        <p class="mt-5">Uploading Video</p>
      {:else}
        <img src="/upload-video.svg" alt="upload" />
        <span class="pt-3">
          <h3 class="text-center text-xl font-normal dark:text-white">Upload video</h3>
          <p class=" text-center text-sm font-normal">
            Select file( Mp4, MOV, AVI) to upload to your lesson.
          </p>
        </span>
      {/if}
      <input
        style="display:none;"
        type="file"
        accept="video/*"
        name="file"
        on:change={() => submit.click()}
        bind:this={fileInput}
      />
      <input type="text" name="lessonId" value={lessonId} style="display: none;" />
      <input style="display:none;" type="submit" bind:this={submit} />
    </form>
  </button>
{:else if $uploadCourseVideoStore.formRes?.type === 'FILE_TOO_LARGE'}
  <div class="h-full w-full flex flex-col items-center justify-center rounded-xl">
    <img src="/video-upload-error.svg" alt="upload error" />
    <span class="pt-3 pb-2">
      <h3 class="text-center text-base font-normal dark:text-white">
        Oops 😬, couldn’t upload video
      </h3>
      <p class="text-center text-xs font-normal text-[#ADADAD]">
        Sorry we video wasn’t uploaded. The file size is too big,<br /> maximum size is 20 MB. Try again!
      </p>
    </span>
    <PrimaryButton label="Try again" />
  </div>
{:else if !$uploadCourseVideoStore.formRes?.success}
  <div class="h-full w-full flex flex-col items-center justify-center rounded-xl">
    <img src="/video-upload-error.svg" alt="upload error" />
    <span class="pt-3 pb-2">
      <h3 class="text-center text-base font-normal dark:text-white">
        Oops 😬, couldn’t upload video
      </h3>
      <p class="text-center text-xs font-normal text-[#ADADAD]">
        Sorry we video wasn’t uploaded, the file format isn’t supported.<br /> Upload MP4, MOV and AVI
        files.
      </p>
    </span>
    <PrimaryButton label="Try again" />
  </div>
{:else}
  <div class="flex flex-col w-full h-full items-start justify-between">
    <div class="h-auto w-full border rounded-md px-8 py-3">
      <div class="flex items-center justify-between">
        <span class="flex items-center gap-2">
          <div class="rounded-sm overflow-hidden">
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
    </div>
  </div>
{/if}
