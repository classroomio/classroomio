<script>
  import axios from 'axios';
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

  let formRes;
  let isLoaded = false;
  let fileInput;
  let submit;
  let uploadedFileUrl = '';
  let isLoading = false;

  function isVideoAdded(link) {
    return $lesson.materials?.videos?.find((v) => v.link === link);
  }

  async function onUpload(e) {
    isLoading = true;
    if (!fileInput) return;

    console.log('file', fileInput.files[0]);
    const formData = new FormData();
    formData.append('videoFile', fileInput.files[0]);
    console.log('formData', formData);

    try {
      const response = await axios({
        method: 'POST',
        url: 'https://classroomio-server.fly.dev/uploadVideo?lessonId=' + lessonId,
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
          metadata: {}
        }
      ];
      saveLesson();
    }
  }

  function tryAgain() {
    formRes = null;
    isLoaded = false;
  }

  $: isDoneUploading(formRes);
</script>

{#if !isLoaded}
  <button
    type="button"
    on:click={() => (fileInput && !isLoading ? fileInput.click() : null)}
    class="w-full h-full"
    disabled={isLoading}
  >
    <form
      class="h-full w-full flex flex-col items-center justify-center border border-blue-300 border-dashed rounded-xl"
      on:submit|preventDefault={onUpload}
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
        name="videoFile"
        on:change={() => submit.click()}
        bind:this={fileInput}
      />
      <input type="text" name="lessonId" value={lessonId} style="display: none;" />
      <input style="display:none;" type="submit" bind:this={submit} />
    </form>
  </button>
{:else if formRes?.type === 'FILE_TOO_LARGE'}
  <div class="h-full w-full flex flex-col items-center justify-center rounded-xl">
    <img src="/video-upload-error.svg" alt="upload error" />
    <span class="pt-3 pb-2">
      <h3 class="text-center text-base font-normal dark:text-white">
        Oops 😬, couldn’t upload video
      </h3>
      <p class="text-center text-xs font-normal text-[#ADADAD]">
        Sorry we video wasn’t uploaded. The file size is too big,<br /> maximum size is 50 MB. Try again!
      </p>
    </span>
    <PrimaryButton label="Try another file" onClick={tryAgain} />
  </div>
{:else if !formRes?.success}
  <div class="h-full w-full flex flex-col items-center justify-center rounded-xl">
    <img src="/video-upload-error.svg" alt="upload error" />
    <span class="pt-3 pb-2">
      <h3 class="text-center text-base font-normal dark:text-white">
        Oops 😬, couldn’t upload video
      </h3>
      <p class="text-center text-xs font-normal text-[#ADADAD]">
        Sorry we video wasn’t uploaded, the file format isn’t supported or something went wrong on
        the server.<br /> Upload MP4, MOV and AVI files.
      </p>
    </span>
    <PrimaryButton label="Please try again" onClick={tryAgain} />
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
      <PrimaryButton label="Done" onClick={() => ($uploadCourseVideoStore.isModalOpen = false)} />
    </div>
  </div>
{/if}
