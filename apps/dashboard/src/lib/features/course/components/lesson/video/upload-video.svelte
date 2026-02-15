<script lang="ts">
  import { Progress } from '@cio/ui/base/progress';
  import { UpgradeBanner } from '$features/ui';
  import { lessonVideoUpload, cancelVideoUpload } from '$features/course/components/lesson/store';
  import { lessonApi } from '$features/course/api';
  import { isFreePlan } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import { VideoUploader } from '$lib/utils/services/courses/presign';
  import { MediaUploader } from './media-uploader';
  import { Button } from '@cio/ui/base/button';
  import * as FileDropZone from '@cio/ui/custom/file-drop-zone';

  const ADD_VIDEO = 'course.navItem.lessons.materials.tabs.video.add_video';

  interface Props {
    lessonId?: string;
  }

  let { lessonId: _lessonId = '' }: Props = $props();

  let fileSize: number | undefined = $state();

  let formRes: {
    url?: string;
    fileKey?: string;
    status?: number;
    type?: string;
    message?: string;
    thumbnailUrl?: string;
  } | null = $state(null);
  let isLoaded = $state(false);
  let fileName = $state('');

  const isDisabled = $derived($lessonVideoUpload.isUploading || $isFreePlan);

  const videoUploader = new VideoUploader();
  const mediaUploader = new MediaUploader();

  async function handleUpload(files: File[]) {
    const videoFile = files[0];
    if (!videoFile) return;

    if ($isFreePlan) {
      formRes = {
        type: 'AUTHORIZATION_ERROR',
        status: 403,
        message: t.get('upgrade.required')
      };
      isLoaded = true;
      return;
    }

    videoUploader.initUpload();
    fileSize = videoFile.size / (1024 * 1024);
    fileName = videoFile.name;

    try {
      const { url: presignedUrl, fileKey } = await videoUploader.getPresignedUrl(videoFile);

      const [, thumbnailResult] = await Promise.all([
        videoUploader.uploadFile({
          url: presignedUrl,
          file: videoFile
        }),
        mediaUploader.uploadVideoThumbnail(videoFile)
      ]);

      const { urls: presignedUrls } = await videoUploader.getDownloadPresignedUrl([fileKey]);

      formRes = {
        url: presignedUrls[fileKey],
        fileKey: fileKey,
        status: 200,
        thumbnailUrl: thumbnailResult?.url
      };

      const thumbnailUrl = thumbnailResult?.url;
      const durationSeconds = thumbnailResult?.durationSeconds;

      const metadata: {
        fileName?: string;
        createdAt?: string;
        thumbnailUrl?: string;
        duration?: number;
      } = {
        fileName: videoFile.name,
        createdAt: new Date().toISOString()
      };
      if (thumbnailUrl) metadata.thumbnailUrl = thumbnailUrl;
      if (durationSeconds != null && Number.isFinite(durationSeconds)) metadata.duration = durationSeconds;

      lessonApi.updateLessonState(
        'videos',
        [
          {
            type: 'upload',
            link: formRes.url!,
            key: formRes?.fileKey,
            fileName: videoFile.name,
            metadata
          } as { type: 'upload'; link: string; key?: string; metadata?: Record<string, unknown>; fileName?: string }
        ],
        { append: true }
      );

      isLoaded = false;
    } catch (err: any) {
      console.error('Error uploading video', err, '\n\n', err.response);

      if ($lessonVideoUpload.isCancelled) {
        formRes = {
          type: 'CANCELLED',
          status: 0,
          message: t.get(`${ADD_VIDEO}.upload_cancelled`)
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
      isLoaded = true;
      $lessonVideoUpload.isUploading = false;
    }
  }

  function onFileRejected() {
    formRes = {
      type: 'FILE_TOO_LARGE',
      status: 413,
      message: t.get(`${ADD_VIDEO}.maximum_size`)
    };
    isLoaded = true;
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

  let helperText = $derived($lessonVideoUpload.uploadProgress + '%  of ' + Math.round(fileSize || 0) + 'MB');
</script>

<UpgradeBanner className="mb-3" onClick={() => ($lessonVideoUpload.isModalOpen = false)}>
  {$t(`${ADD_VIDEO}.upgrade`)}
</UpgradeBanner>

{#if !isLoaded}
  {#if $lessonVideoUpload.isUploading}
    <div
      class="border-primary-300 flex h-full w-full flex-col items-center justify-center rounded-xl border border-dashed"
    >
      <div class="flex w-[60%] max-w-[500px] flex-col justify-center gap-5">
        <p class="mt-5 text-center">
          {$t(`${ADD_VIDEO}.uploading`)}
        </p>
        <Progress class="w-full" value={$lessonVideoUpload.uploadProgress} max={100} />
        <p class="text-sm">{helperText}</p>
        <div class="mt-3">
          <Button variant="outline" onclick={cancelUpload}>
            {$t(`${ADD_VIDEO}.cancel_upload`)}
          </Button>
        </div>
      </div>
    </div>
  {:else}
    <div class="h-full w-full {isDisabled ? 'ui:opacity-50 ui:pointer-events-none' : ''}">
      <FileDropZone.Root
        accept="video/*"
        maxFiles={1}
        fileCount={0}
        maxFileSize={500 * FileDropZone.MEGABYTE}
        onUpload={handleUpload}
        {onFileRejected}
      >
        <FileDropZone.Trigger
          label={$t(`${ADD_VIDEO}.select_file`)}
          formatMaxFiles={(count) => $t(`${ADD_VIDEO}.max_files`, { count })}
          formatMaxFilesAndSize={(size) => $t(`${ADD_VIDEO}.max_files_and_size`, { size })}
          formatMaxSize={() => $t(`${ADD_VIDEO}.size`)}
        />
      </FileDropZone.Root>
    </div>
  {/if}
{:else if formRes?.type === 'FILE_TOO_LARGE'}
  <div class="flex h-full w-full flex-col items-center justify-center rounded-xl">
    <img src="/video-upload-error.svg" alt="upload error" />
    <span class="pt-3 pb-2">
      <h3 class="text-center text-base font-normal dark:text-white">
        {$t(`${ADD_VIDEO}.oops`)}
      </h3>
      <p class="text-center text-xs font-normal text-[#ADADAD]">
        {$t(`${ADD_VIDEO}.big_file`)}<br />
        {$t(`${ADD_VIDEO}.maximum_size`)}
      </p>
    </span>
    <Button onclick={tryAgain}>
      {$t(`${ADD_VIDEO}.button`)}
    </Button>
  </div>
{:else if formRes?.status !== 200}
  <div class="flex h-full w-full flex-col items-center justify-center rounded-xl">
    <img src="/video-upload-error.svg" alt="upload error" />
    <span class="pt-3 pb-2">
      <h3 class="text-center text-base font-normal dark:text-white">
        {$t(`${ADD_VIDEO}.oops`)}
      </h3>
      <p class="text-center text-xs font-normal text-[#ADADAD]">
        {$t(`${ADD_VIDEO}.unsupported_format`)}<br />
        {$t(`${ADD_VIDEO}.format`)}
      </p>
    </span>
    <Button onclick={tryAgain}>
      {$t(`${ADD_VIDEO}.try_again`)}
    </Button>
  </div>
{:else}
  <div class=" w-full rounded-md border px-8 py-3">
    <div class="flex flex-col items-center gap-8">
      <div class="flex flex-col items-center gap-2">
        {#if formRes.thumbnailUrl}
          <img
            src={formRes.thumbnailUrl}
            alt={fileName}
            class="border-primary-300 h-auto w-[200px] rounded-md border object-cover"
          />
        {:else}
          <video class="border-primary-300 w-[200px] rounded-md border">
            <source src={formRes.url} type="video/mp4" />
            <track kind="captions" />
            <p>{$t('generic.loading')}</p>
          </video>
        {/if}
        <p>{fileName}</p>
      </div>
      <Button onclick={() => ($lessonVideoUpload.isModalOpen = false)}>
        {$t('course.navItem.lessons.materials.button_done')}
      </Button>
    </div>
  </div>
{/if}
