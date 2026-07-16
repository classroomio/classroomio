<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { MediaPlayer } from '@cio/ui/custom/media-player';
  import { presignApi } from '$features/course/api/presign.svelte';
  import { mediaApi } from '$features/media/api';
  import { jobsApi, JobPoller, type MediaJobEnvelope } from '$features/jobs';
  import { t } from '$lib/utils/functions/translations';
  import { sidePanel } from '$features/side-panel';
  import { classroomio, isAuthError } from '$lib/utils/services/api';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { lessonApi } from '$features/course/api';
  import { snackbar } from '$features/ui/snackbar/store';
  import type { AssetTranscriptPayload } from '$features/media/utils/types';
  import { isCourseLearnerView } from '$lib/utils/store/app';
  import { resolveWatchEnforcedAssetIds, type LessonVideo } from './video-card-utils';
  import { lessonVideoBus } from './lesson-video-bus.svelte';
  import { TRANSCRIPT_PANEL_ID } from './transcript-panel-definition';

  /**
   * HLS playback flag — set by the upload flow when the asset was encoded
   * via Mediabunny and stored as a manifest. `video.metadata` is untyped
   * `Record<string, unknown>` at the call site, so the cast keeps the
   * boolean lookup honest.
   */
  function isHlsVideo(v: LessonVideo): boolean {
    return Boolean((v.metadata as { hls?: boolean } | undefined)?.hls);
  }

  /**
   * Build a fully-qualified URL for an HLS manifest or segment from the
   * relative `/hls/{assetId}/{rest}` form stored in `lesson.videos[].link`.
   * Uses the typed Hono client so the URL goes through the same base every
   * other API call uses (PUBLIC_SERVER_URL locally, `${origin}/proxy/...`
   * in Cloud production — the tenant-router Worker intercepts the latter
   * and streams directly from R2).
   */
  function resolveHlsUrl(rawUrl: string): string {
    if (/^https?:\/\//i.test(rawUrl)) return rawUrl;
    const match = rawUrl.match(/^\/?hls\/([^/]+)\/(.+)$/);
    if (!match) return rawUrl;

    const [, assetId, rest] = match;
    const built = classroomio.hls[':assetId']['*'].$url({ param: { assetId } });
    return built.toString().replace(/\/\*$/, '') + '/' + rest;
  }

  async function mintHlsCookie(assetId: string): Promise<{ authExpired?: boolean } | void> {
    try {
      await classroomio.organization.assets[':assetId'].hls.cookie.$post({
        param: { assetId }
      });
    } catch (error) {
      // A 401 here means the viewer's session expired — the player should
      // prompt a re-login rather than retry. Other failures (e.g. 503 when
      // HLS_SIGNING_SECRET is unset locally) fall through so playback can
      // still attempt the session-auth streaming route.
      if (isAuthError(error)) return { authExpired: true };
    }
  }

  /**
   * Fetch the transcript VTT through the typed RPC client and turn it
   * into a `blob:` URL. We can't point the `<track>` element directly at
   * the api URL: `<video crossorigin>` would force CORS on every video
   * subresource (poster on r2.dev, Plyr's `blank.mp4`, …) and break
   * those. Without `crossorigin` the browser refuses cross-origin
   * tracks. `blob:` URLs side-step both: same-origin from the browser's
   * POV, and the fetch itself runs through the same auth'd path as
   * every other API call.
   */
  let blobTrackUrl = $state<string | null>(null);
  let revokeBlobTrackUrl: (() => void) | null = null;

  async function loadTranscriptTrack(rawUrl: string): Promise<void> {
    const match = rawUrl.match(/^\/?transcripts\/([^/]+)\/track\.vtt$/);
    if (!match) {
      blobTrackUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : null;
      return;
    }

    const [, assetId] = match;
    try {
      const response = await classroomio.transcripts[':assetId']['track.vtt'].$get({ param: { assetId } });
      if (!response.ok) return;

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      revokeBlobTrackUrl?.();
      revokeBlobTrackUrl = () => URL.revokeObjectURL(url);
      blobTrackUrl = url;
    } catch (error) {
      console.warn('Failed to load transcript track', error);
    }
  }

  interface Props {
    video: LessonVideo;
    courseId: string;
    lessonId: string;
    videoIndex: number;
  }

  let { video, courseId, lessonId, videoIndex }: Props = $props();

  let localTranscript = $state<AssetTranscriptPayload | null>(null);
  let localTranscriptLoading = $state(false);

  // The parent keys this component on the upload assetId / link, so each
  // mount maps to a single asset; lifecycle is plain onMount/onDestroy.
  const uploadAssetId =
    video.type === 'upload' ? ((video as LessonVideo & { assetId?: string }).assetId ?? null) : null;
  const uploadStorageKey =
    video.type === 'upload' && typeof video.key === 'string' && video.key.length > 0 ? video.key : null;

  /** Refresh ~10 minutes before server presign expiry (1 hour). */
  const PLAYBACK_URL_REFRESH_MS = 50 * 60 * 1000;

  let isMounted = true;
  const isHls = $derived(isHlsVideo(video));
  let playbackUrl = $state(isHlsVideo(video) ? resolveHlsUrl(video.link) : video.link);
  let playbackUrlIssuedAt = $state(Date.now());
  let playbackRefreshTimer: ReturnType<typeof setTimeout> | null = null;
  let vttRefetchTimer: ReturnType<typeof setTimeout> | null = null;
  let jobPoller: JobPoller<MediaJobEnvelope> | null = null;

  let localSeekFn: (seconds: number) => void = () => {};

  function ownsPlaybackBus(): boolean {
    return uploadAssetId !== null && lessonVideoBus.assetId === uploadAssetId;
  }

  function syncPlaybackBus(): void {
    if (!uploadAssetId) return;

    lessonVideoBus.assetId = uploadAssetId;
    lessonVideoBus.setSeekFn(localSeekFn);
  }

  function syncTranscriptToRegistry(): void {
    if (!uploadAssetId) return;

    lessonVideoBus.updateTranscriptSource(uploadAssetId, {
      transcript: localTranscript,
      transcriptLoading: localTranscriptLoading
    });
  }

  $effect(() => {
    const rawUrl = localTranscript?.vttUrl;
    if (!rawUrl) {
      revokeBlobTrackUrl?.();
      revokeBlobTrackUrl = null;
      blobTrackUrl = null;
      return;
    }
    void loadTranscriptTrack(rawUrl);
  });

  $effect(() => {
    playbackUrl = isHlsVideo(video) ? resolveHlsUrl(video.link) : video.link;
    playbackUrlIssuedAt = Date.now();
    schedulePlaybackUrlRefresh();
  });

  function clearPlaybackRefreshTimer() {
    if (playbackRefreshTimer) {
      clearTimeout(playbackRefreshTimer);
      playbackRefreshTimer = null;
    }
  }

  function schedulePlaybackUrlRefresh() {
    clearPlaybackRefreshTimer();
    if (!uploadStorageKey || isHls) return;

    const delayMs = PLAYBACK_URL_REFRESH_MS - (Date.now() - playbackUrlIssuedAt);
    if (delayMs <= 0) {
      void refreshPlaybackUrlIfIdle();
      return;
    }

    playbackRefreshTimer = setTimeout(() => {
      void refreshPlaybackUrlIfIdle();
    }, delayMs);
  }

  async function refreshPlaybackUrl(): Promise<string | null> {
    if (!uploadStorageKey || !isMounted) return null;

    const urls = await presignApi.getVideoDownloadUrls([uploadStorageKey]);
    const freshUrl = urls[uploadStorageKey];

    if (!freshUrl || !isMounted) return null;

    playbackUrl = freshUrl;
    playbackUrlIssuedAt = Date.now();
    schedulePlaybackUrlRefresh();

    return freshUrl;
  }

  async function refreshPlaybackUrlIfIdle(): Promise<string | null> {
    if (lessonVideoBus.hasPlayed) return null;

    return refreshPlaybackUrl();
  }

  async function handlePlaybackReload(): Promise<boolean> {
    pendingResumeSeconds = lessonVideoBus.currentTimeSeconds;

    if (uploadStorageKey) {
      return Boolean(await refreshPlaybackUrl());
    }

    return true;
  }

  let pendingResumeSeconds: number | null = null;

  function handleSourceLoaded(element: HTMLVideoElement) {
    if (pendingResumeSeconds == null || pendingResumeSeconds <= 0) return;

    element.currentTime = pendingResumeSeconds;
    pendingResumeSeconds = null;
  }

  function clearVttRefetchTimer() {
    if (vttRefetchTimer) {
      clearTimeout(vttRefetchTimer);
      vttRefetchTimer = null;
    }
  }

  function scheduleVttRefetch(expiresAtIso: string | undefined) {
    clearVttRefetchTimer();
    if (!expiresAtIso) return;

    const deadlineMs = new Date(expiresAtIso).getTime() - 60_000;
    const delayMs = deadlineMs - Date.now();

    if (delayMs <= 0) {
      void loadTranscript();

      return;
    }

    vttRefetchTimer = setTimeout(() => {
      void loadTranscript();
    }, delayMs);
  }

  function stopJobPoller() {
    jobPoller?.stop();
    jobPoller = null;
  }

  async function loadTranscript(): Promise<void> {
    if (!uploadAssetId) {
      if (isMounted) {
        localTranscript = null;
        syncTranscriptToRegistry();
      }

      return;
    }

    if (!isMounted) return;

    localTranscriptLoading = true;
    syncTranscriptToRegistry();

    try {
      const data = await mediaApi.getAssetTranscript(uploadAssetId);

      if (!isMounted) return;

      localTranscript = data;
      scheduleVttRefetch(data?.vttUrlExpiresAt);
      syncTranscriptToRegistry();
    } finally {
      if (isMounted) {
        localTranscriptLoading = false;
        syncTranscriptToRegistry();
      }
    }
  }

  async function watchJobsUntilTerminalThenReload(): Promise<void> {
    if (!uploadAssetId || localTranscript || !isMounted) return;

    stopJobPoller();

    const runs = await jobsApi.getMediaJobsForAsset(uploadAssetId);

    if (!isMounted) return;

    const latest = runs?.[0];

    if (!latest) return;

    if (latest.job.status === 'completed') {
      void loadTranscript();

      return;
    }

    if (latest.job.status === 'failed' || latest.job.status === 'canceled') {
      return;
    }

    jobPoller = new JobPoller<MediaJobEnvelope>({
      fetch: () => jobsApi.getMediaJob(latest.job.id),
      onUpdate: (envelope) => {
        if (envelope.job.status === 'completed') {
          stopJobPoller();
          void loadTranscript();
        }

        if (envelope.job.status === 'failed' || envelope.job.status === 'canceled') {
          stopJobPoller();
        }
      }
    });
    jobPoller.start();
  }

  const isEnforceableUpload = $derived(video.type === 'upload' || isHls);

  const isWatchEnforcedForVideo = $derived.by(() => {
    const lesson = lessonApi.lesson;
    if (!lesson || !uploadAssetId || !isEnforceableUpload) return false;

    const enforcedAssetIds = resolveWatchEnforcedAssetIds(lesson.videos, lesson.completionPolicy);

    return enforcedAssetIds.includes(uploadAssetId);
  });

  const assetWatchProgress = $derived.by(() => {
    const lesson = lessonApi.lesson;
    if (!lesson?.watchProgress?.assets || !uploadAssetId) return null;

    return lesson.watchProgress.assets.find((asset) => asset.assetId === uploadAssetId) ?? null;
  });

  const seekPolicy = $derived.by(() => {
    const lesson = lessonApi.lesson;
    if (!$isCourseLearnerView || !lesson || lesson.completionPolicy !== 'video_watch' || !isWatchEnforcedForVideo) {
      return undefined;
    }

    if (assetWatchProgress?.isComplete) {
      return undefined;
    }

    return {
      mode: 'locked_until_complete' as const,
      watchThresholdPercent: lesson.videoWatchThreshold ?? 95,
      initialFurthestSeconds: assetWatchProgress?.furthestSeconds ?? 0,
      pauseOnHidden: true,
      onProgress: (payload: { positionSeconds: number; playedDeltaSeconds: number; durationSeconds: number }) => {
        if (!uploadAssetId) return;

        void lessonApi.reportWatchProgress(courseId, lessonId, {
          ...payload,
          assetId: uploadAssetId
        });
      },
      onSeekBlocked: () => {
        snackbar.error('course.navItem.lessons.watch_progress.seek_blocked');
      }
    };
  });

  async function restoreWatchProgress(): Promise<void> {
    if (!$isCourseLearnerView || !uploadAssetId) return;

    const cachedAsset = assetWatchProgress;
    if (cachedAsset?.lastPositionSeconds && cachedAsset.lastPositionSeconds > 0) {
      pendingResumeSeconds = cachedAsset.lastPositionSeconds;
      return;
    }

    const progress = await lessonApi.getWatchProgress(courseId, lessonId);
    const assetProgress = progress?.assets?.find((asset) => asset.assetId === uploadAssetId);
    if (assetProgress?.lastPositionSeconds && assetProgress.lastPositionSeconds > 0) {
      pendingResumeSeconds = assetProgress.lastPositionSeconds;
    }
  }

  onMount(() => {
    if (uploadAssetId) {
      lessonVideoBus.registerTranscriptSource({
        assetId: uploadAssetId,
        videoIndex,
        transcript: null,
        transcriptLoading: false,
        currentTimeSeconds: 0,
        seek: (seconds) => localSeekFn(seconds)
      });
    }

    if (lessonVideoBus.assetId === null || lessonVideoBus.assetId === uploadAssetId) {
      syncPlaybackBus();
    }

    void restoreWatchProgress();

    void (async () => {
      await loadTranscript();
      if (!isMounted) return;

      await watchJobsUntilTerminalThenReload();
    })();
  });

  onDestroy(() => {
    isMounted = false;
    clearPlaybackRefreshTimer();
    clearVttRefetchTimer();
    stopJobPoller();
    revokeBlobTrackUrl?.();
    revokeBlobTrackUrl = null;

    if (uploadAssetId) {
      lessonVideoBus.unregisterTranscriptSource(uploadAssetId);
    }

    if (lessonVideoBus.transcriptSources.size === 0) {
      lessonVideoBus.reset();
      sidePanel.closeIfScope('lesson');
      return;
    }

    if (uploadAssetId && ownsPlaybackBus()) {
      lessonVideoBus.assetId = null;
      lessonVideoBus.currentTimeSeconds = 0;
      lessonVideoBus.hasPlayed = false;
      lessonVideoBus.setSeekFn(() => {});
    }
  });

  const tracks = $derived(
    blobTrackUrl && localTranscript
      ? [
          {
            kind: 'captions' as const,
            src: blobTrackUrl,
            srclang: localTranscript.language,
            label: t.get('course.navItem.lessons.materials.tabs.video.transcript.captions_label'),
            default: false
          }
        ]
      : []
  );

  function handleFirstPlay() {
    syncPlaybackBus();
    lessonVideoBus.hasPlayed = true;
  }

  function openTranscriptPanel() {
    if (!uploadAssetId) return;

    lessonVideoBus.selectTranscriptSource(uploadAssetId);
    sidePanel.open(TRANSCRIPT_PANEL_ID);
  }

  const transcriptPanelControl = $derived(
    localTranscript
      ? {
          label: t.get('course.navItem.lessons.materials.tabs.video.transcript.open_side_panel'),
          onClick: openTranscriptPanel
        }
      : undefined
  );
</script>

<div class="w-full">
  <MediaPlayer
    source={{
      type: video.type,
      url: playbackUrl,
      hls: isHls,
      metadata: video.metadata as { thumbnailUrl?: string; title?: string } | undefined,
      tracks
    }}
    options={{
      maxHeight: '569px',
      width: '100%',
      controls: true,
      playsinline: true,
      onTimeUpdate: (seconds) => {
        if (uploadAssetId) {
          lessonVideoBus.updateTranscriptSource(uploadAssetId, { currentTimeSeconds: seconds });
        }

        if (ownsPlaybackBus()) {
          lessonVideoBus.currentTimeSeconds = seconds;
        }
      },
      onPlayerReady: (player) => {
        localSeekFn = (seconds) => {
          player.currentTime = seconds;
        };

        if (ownsPlaybackBus()) {
          lessonVideoBus.setSeekFn(localSeekFn);
        }
      },
      onFirstPlay: handleFirstPlay,
      onSourceLoaded: handleSourceLoaded,
      onBeforeHlsLoad: isHls && uploadAssetId ? () => mintHlsCookie(uploadAssetId) : undefined,
      transcriptPanelControl,
      loadingLabel: $t('course.navItem.lessons.materials.tabs.video.loading'),
      playbackErrorLabel: $t('course.navItem.lessons.materials.tabs.video.playback_error'),
      playbackReloadLabel: $t('course.navItem.lessons.materials.tabs.video.playback_reload'),
      onPlaybackReload: handlePlaybackReload,
      playbackAuthErrorLabel: $t('course.navItem.lessons.materials.tabs.video.playback_auth_error'),
      playbackAuthActionLabel: $t('course.navItem.lessons.materials.tabs.video.playback_auth_action'),
      onPlaybackAuthRequired: () => goto(resolve('/login', {})),
      seekPolicy
    }}
  />
</div>
