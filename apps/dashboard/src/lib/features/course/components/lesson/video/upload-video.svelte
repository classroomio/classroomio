<script lang="ts">
  import { Progress } from '@cio/ui/base/progress';
  import { UpgradeBanner } from '$features/ui';
  import { lessonVideoUpload, cancelVideoUpload } from '$features/course/components/lesson/store';
  import { lessonApi } from '$features/course/api';
  import { isFreePlan } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import { VideoUploader } from '$lib/utils/services/courses/presign';
  import { MediaUploader } from './media-uploader';
  import { encodeAndUploadHls, cleanupAbortedHlsUpload, type HlsEncodeProgress } from './hls-encoder';
  import { env as publicEnv } from '$env/dynamic/public';
  import { Button } from '@cio/ui/base/button';
  import * as FileDropZone from '@cio/ui/custom/file-drop-zone';
  import { mediaApi } from '$features/media/api';
  import { JobPoller, jobsApi, type MediaJobEnvelope } from '$features/jobs';
  import { onDestroy } from 'svelte';
  import { getResolvedUploadLimits } from '$lib/utils/config/upload-limits-context';

  const ADD_VIDEO = 'course.navItem.lessons.materials.tabs.video.add_video';
  const PROCESSING_BASE = `${ADD_VIDEO}.processing`;

  interface Props {
    lessonId?: string;
  }

  let { lessonId: _lessonId = '' }: Props = $props();

  let fileSize: number | undefined = $state();
  let hlsProgress: HlsEncodeProgress | null = $state(null);
  let hlsAbortController: AbortController | null = null;
  let hlsReservedAssetId: string | null = $state(null);

  /**
   * HLS is the default upload path on Cloud. Self-hosted installs fall
   * back to raw-MP4 upload (no R2 + tenant-router edge dependency).
   */
  const hlsEnabled = $derived(publicEnv.PUBLIC_IS_SELFHOSTED !== 'true');

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
  let processingJob: MediaJobEnvelope['job'] | null = $state(null);
  let activePoller: JobPoller<MediaJobEnvelope> | null = null;

  const isDisabled = $derived($lessonVideoUpload.isUploading || $isFreePlan);

  const uploadLimits = getResolvedUploadLimits();
  const maxVideoSize = uploadLimits.videoBytes;

  const videoUploader = new VideoUploader();
  const mediaUploader = new MediaUploader();

  function processingLabel(stage: string | null, status: string): string | null {
    if (status === 'failed') return t.get(`${PROCESSING_BASE}.failed`);
    if (status === 'canceled') return t.get(`${PROCESSING_BASE}.canceled`);
    if (status === 'completed') return t.get(`${PROCESSING_BASE}.completed`);

    switch (stage) {
      case 'probing':
        return t.get(`${PROCESSING_BASE}.probing`);
      case 'thumbnailing':
        return t.get(`${PROCESSING_BASE}.thumbnailing`);
      case 'extracting-audio':
        return t.get(`${PROCESSING_BASE}.extracting_audio`);
      case 'transcribing':
        return t.get(`${PROCESSING_BASE}.transcribing`);
      case 'compressing':
        return t.get(`${PROCESSING_BASE}.compressing`);
      default:
        return t.get(`${PROCESSING_BASE}.queued`);
    }
  }

  function startProcessingPoll(assetId: string) {
    activePoller?.stop();
    activePoller = null;
    processingJob = null;

    void (async () => {
      const runs = await jobsApi.getMediaJobsForAsset(assetId);
      const latest = runs?.[0];
      if (!latest) return;

      processingJob = latest.job;
      if (latest.job.status === 'completed' || latest.job.status === 'failed' || latest.job.status === 'canceled') {
        return;
      }

      activePoller = new JobPoller<MediaJobEnvelope>({
        fetch: () => jobsApi.getMediaJob(latest.job.id),
        onUpdate: (envelope) => {
          processingJob = envelope.job;
        }
      });
      activePoller.start();
    })();
  }

  onDestroy(() => {
    activePoller?.stop();
  });

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

    if (hlsEnabled) {
      hlsAbortController = new AbortController();
      hlsReservedAssetId = null;
      try {
        const result = await encodeAndUploadHls({
          file: videoFile,
          title: videoFile.name,
          signal: hlsAbortController.signal,
          onAssetReserved: (assetId) => {
            hlsReservedAssetId = assetId;
          },
          onProgress: (p) => {
            hlsProgress = p;
            $lessonVideoUpload.uploadProgress = p.percent;
          }
        });
        hlsReservedAssetId = null;

        const lessonVideoPosition = Array.isArray(lessonApi.lesson?.videos) ? lessonApi.lesson?.videos.length : 0;
        if (_lessonId) {
          await mediaApi.attachAsset(result.assetId, {
            targetType: 'lesson',
            targetId: _lessonId,
            slotType: 'lesson_video',
            position: lessonVideoPosition
          });
        }

        const hlsManifestUrl = `/hls/${result.assetId}/master.m3u8`;
        lessonApi.updateLessonState(
          'videos',
          [
            {
              type: 'upload',
              link: hlsManifestUrl,
              assetId: result.assetId,
              fileName: videoFile.name,
              metadata: {
                fileName: videoFile.name,
                createdAt: new Date().toISOString(),
                hls: true,
                sourceWidth: result.sourceWidth,
                sourceHeight: result.sourceHeight,
                hlsRenditions: result.hlsRenditions,
                hls1080Status: result.hls1080Status,
                ...(result.thumbnailUrl ? { thumbnailUrl: result.thumbnailUrl } : {})
              }
            } as {
              type: 'upload';
              link: string;
              assetId?: string;
              metadata?: Record<string, unknown>;
              fileName?: string;
            }
          ],
          { append: true }
        );

        formRes = {
          url: hlsManifestUrl,
          fileKey: result.manifestKey,
          status: 200,
          thumbnailUrl: result.thumbnailUrl
        };
        startProcessingPoll(result.assetId);
        isLoaded = true;
        return;
      } catch (err) {
        console.error('HLS encode failed', err);
        hlsReservedAssetId = null;
        formRes = {
          type: 'INTERNAL_ERROR',
          status: 500,
          message: err instanceof Error ? err.message : t.get('hls_upload.error.encode_failed')
        };
        isLoaded = true;
        return;
      } finally {
        $lessonVideoUpload.isUploading = false;
      }
    }

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
      const normalizedDurationSeconds =
        durationSeconds != null && Number.isFinite(durationSeconds)
          ? Math.max(0, Math.round(durationSeconds))
          : undefined;

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
      if (normalizedDurationSeconds != null) metadata.duration = normalizedDurationSeconds;

      const lessonVideoPosition = Array.isArray(lessonApi.lesson?.videos) ? lessonApi.lesson?.videos.length : 0;
      let assetId: string | undefined;
      if (_lessonId) {
        const asset = await mediaApi.registerUploadedLessonVideo({
          lessonId: _lessonId,
          position: lessonVideoPosition,
          fileKey,
          videoUrl: formRes.url!,
          fileName: videoFile.name,
          mimeType: videoFile.type,
          byteSize: videoFile.size,
          thumbnailUrl,
          durationSeconds: normalizedDurationSeconds
        });
        assetId = asset?.id;
      } else {
        const asset = await mediaApi.createAsset({
          kind: 'video',
          provider: 'upload',
          storageProvider: 's3',
          storageKey: fileKey,
          sourceUrl: formRes.url!,
          mimeType: videoFile.type,
          byteSize: videoFile.size,
          title: videoFile.name,
          thumbnailUrl,
          durationSeconds: normalizedDurationSeconds,
          isExternal: false,
          metadata
        });
        assetId = asset?.id;
      }

      lessonApi.updateLessonState(
        'videos',
        [
          {
            type: 'upload',
            link: formRes.url!,
            key: formRes?.fileKey,
            assetId,
            fileName: videoFile.name,
            metadata
          } as {
            type: 'upload';
            link: string;
            key?: string;
            assetId?: string;
            metadata?: Record<string, unknown>;
            fileName?: string;
          }
        ],
        { append: true }
      );

      if (assetId) {
        startProcessingPoll(assetId);
      }

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
    hlsAbortController?.abort();

    const reservedAssetId = hlsReservedAssetId;
    hlsReservedAssetId = null;
    if (reservedAssetId) {
      void cleanupAbortedHlsUpload(reservedAssetId);
    }

    cancelVideoUpload();

    formRes = null;
    isLoaded = false;
    $lessonVideoUpload.uploadProgress = 0;
  }

  let helperText = $derived.by(() => {
    const hp = hlsProgress;
    if (!hp) return $lessonVideoUpload.uploadProgress + '%  of ' + Math.round(fileSize || 0) + 'MB';

    const stageLabel = t.get(`hls_upload.stage.${hp.stage}`);
    return `${stageLabel} ${hp.percent}%`;
  });
</script>

<UpgradeBanner className="mb-3" onClick={() => ($lessonVideoUpload.isModalOpen = false)}>
  {$t(`${ADD_VIDEO}.upgrade`)}
</UpgradeBanner>

{#if !isLoaded}
  {#if $lessonVideoUpload.isUploading}
    <div
      class="border-primary-300 flex h-full w-full flex-col items-center justify-center rounded-xl border border-dashed py-4"
    >
      <div class="flex w-full max-w-[500px] flex-col items-center gap-5 px-6 text-center">
        <p>
          {$t(`${ADD_VIDEO}.uploading`)}
        </p>
        <Progress class="w-full" value={$lessonVideoUpload.uploadProgress} max={100} />
        <p class="text-sm">{helperText}</p>
        <div class="mt-3 flex justify-center">
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
        maxFileSize={maxVideoSize}
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
        {#if processingJob}
          {@const label = processingLabel(processingJob.stage, processingJob.status)}
          {#if label}
            <p class="ui:text-muted-foreground text-xs">{label}</p>
            {#if processingJob.status !== 'completed' && processingJob.status !== 'failed' && processingJob.status !== 'canceled'}
              <Progress class="w-[200px]" value={processingJob.progressPercent ?? 0} max={100} />
            {/if}
          {/if}
        {/if}
      </div>
      <Button onclick={() => ($lessonVideoUpload.isModalOpen = false)}>
        {$t('course.navItem.lessons.materials.button_done')}
      </Button>
    </div>
  </div>
{/if}
