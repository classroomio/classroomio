<script>
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { deleteLessonVideo } from '$lib/components/Course/components/Lesson/store/lessons';

  let isWrongFormat = false;
  let isUploaded = false;
  let isLoaded = false;
  let isBig = false;

  const uploadVideo = () => {
    // if the file is too big or not the correct format
    isWrongFormat = true;

    // when the upload has been sucessfully completed
    // here the you set the video_url to something and that would be displayed on the page
    isUploaded = false;

    //  closes the modal
    //  $uploadCourseVideo.isModalOpen = false;
  };

  const onUpload = () => {
    // PROBABLY GET THE SNAPSHOT OR SOMETHING
    isLoaded = true;
  };
</script>

{#if isLoaded == false}
  <button
    on:click={onUpload}
    class="h-full w-full flex flex-col items-center justify-center border border-blue-300 border-dashed rounded-xl"
  >
    <img src="/upload-video.svg" alt="upload" />
    <span class="pt-3">
      <h3 class="text-center text-xl font-normal dark:text-white">Upload video</h3>
      <p class=" text-center text-sm font-normal">
        Select file( Mp4, MOV, AVI) to upload or drag and drop video here.<br /> Size must be less than
        20 MB.
      </p>
    </span>
  </button>
{:else if isBig && isUploaded == false}
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
{:else if isWrongFormat && isUploaded == false}
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
            <img src="/course-video.png" alt="coursevideo" class="object-cover" />
          </div>
          <p>Video.png</p>
        </span>
        <button on:click={deleteLessonVideo}>
          <img src="/delete-video.svg" alt="deletevideo" class="dark:invert" />
        </button>
      </div>
    </div>
    <div class="ml-auto">
      <PrimaryButton label="upload" onClick={uploadVideo} />
    </div>
  </div>
{/if}
