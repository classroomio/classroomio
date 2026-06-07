<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { MediaPlayer } from '@cio/ui/custom/media-player';
  import { presignApi } from '$features/course/api/presign.svelte';
  import { mediaApi } from '$features/media/api';
  import { jobsApi, JobPoller, type MediaJobEnvelope } from '$features/jobs';
  import { t } from '$lib/utils/functions/translations';
  import { sidePanel } from '$features/side-panel';
  import { classroomio } from '$lib/utils/services/api';
  import type { AssetTranscriptPayload } from '$features/media/utils/types';
  import type { LessonVideo } from './video-card-utils';
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

  async function mintHlsCookie(assetId: string): Promise<void> {
    await classroomio.organization.assets[':assetId'].hls.cookie.$post({
      param: { assetId }
    });
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
  }

  let { video }: Props = $props();

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

  function ownsVideoBus(): boolean {
    return uploadAssetId !== null && lessonVideoBus.assetId === uploadAssetId;
  }

  function syncVideoBus(): void {
    if (!uploadAssetId) return;

    lessonVideoBus.assetId = uploadAssetId;
    lessonVideoBus.transcript = localTranscript;
    lessonVideoBus.transcriptLoading = localTranscriptLoading;
    lessonVideoBus.setSeekFn(localSeekFn);
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
        if (ownsVideoBus()) {
          lessonVideoBus.transcript = null;
        }
      }

      return;
    }

    if (!isMounted) return;

    localTranscriptLoading = true;
    if (ownsVideoBus()) {
      lessonVideoBus.transcriptLoading = true;
    }

    try {
      const data = await mediaApi.getAssetTranscript(uploadAssetId);

      if (!isMounted) return;

      localTranscript = data;
      scheduleVttRefetch(data?.vttUrlExpiresAt);
      if (ownsVideoBus()) {
        lessonVideoBus.transcript = data;
      }
    } finally {
      if (isMounted) {
        localTranscriptLoading = false;
        if (ownsVideoBus()) {
          lessonVideoBus.transcriptLoading = false;
        }
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

  onMount(() => {
    if (lessonVideoBus.assetId === null || lessonVideoBus.assetId === uploadAssetId) {
      syncVideoBus();
    }

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
    if (ownsVideoBus()) {
      lessonVideoBus.reset();
      sidePanel.closeIfScope('lesson');
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
    syncVideoBus();
    lessonVideoBus.hasPlayed = true;
  }

  const transcriptPanelControl = $derived(
    localTranscript
      ? {
          label: t.get('course.navItem.lessons.materials.tabs.video.transcript.open_side_panel'),
          onClick: () => {
            syncVideoBus();
            sidePanel.open(TRANSCRIPT_PANEL_ID);
          }
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
        if (ownsVideoBus()) {
          lessonVideoBus.currentTimeSeconds = seconds;
        }
      },
      onPlayerReady: (player) => {
        localSeekFn = (seconds) => {
          player.currentTime = seconds;
        };
        if (ownsVideoBus()) {
          lessonVideoBus.setSeekFn(localSeekFn);
        }
      },
      onFirstPlay: handleFirstPlay,
      onSourceLoaded: handleSourceLoaded,
      onBeforeHlsLoad: isHls && uploadAssetId ? () => mintHlsCookie(uploadAssetId) : undefined,
      transcriptPanelControl,
      playbackErrorLabel: $t('course.navItem.lessons.materials.tabs.video.playback_error'),
      playbackReloadLabel: $t('course.navItem.lessons.materials.tabs.video.playback_reload'),
      onPlaybackReload: handlePlaybackReload
    }}
  />
</div>
