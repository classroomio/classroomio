<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { MediaPlayer } from '@cio/ui/custom/media-player';
  import { mediaApi } from '$features/media/api';
  import { jobsApi, JobPoller, type MediaJobEnvelope } from '$features/jobs';
  import { t } from '$lib/utils/functions/translations';
  import { sidePanel } from '$features/side-panel';
  import type { LessonVideo } from './video-card-utils';
  import { lessonVideoBus } from './lesson-video-bus.svelte';
  import { TRANSCRIPT_PANEL_ID } from './transcript-panel-definition';

  interface Props {
    video: LessonVideo;
  }

  let { video }: Props = $props();

  // The parent keys this component on the upload assetId / link, so each
  // mount maps to a single asset; lifecycle is plain onMount/onDestroy.
  const uploadAssetId =
    video.type === 'upload' ? ((video as LessonVideo & { assetId?: string }).assetId ?? null) : null;

  let isMounted = true;
  let vttRefetchTimer: ReturnType<typeof setTimeout> | null = null;
  let jobPoller: JobPoller<MediaJobEnvelope> | null = null;
  let hasAutoOpenedTranscript = false;

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
        lessonVideoBus.transcript = null;
      }

      return;
    }

    if (!isMounted) return;

    lessonVideoBus.transcriptLoading = true;

    try {
      const data = await mediaApi.getAssetTranscript(uploadAssetId);

      if (!isMounted) return;

      lessonVideoBus.transcript = data;
      scheduleVttRefetch(data?.vttUrlExpiresAt);
    } finally {
      if (isMounted) {
        lessonVideoBus.transcriptLoading = false;
      }
    }
  }

  async function watchJobsUntilTerminalThenReload(): Promise<void> {
    if (!uploadAssetId || lessonVideoBus.transcript || !isMounted) return;

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
    lessonVideoBus.reset();
    lessonVideoBus.assetId = uploadAssetId;

    void (async () => {
      await loadTranscript();
      if (!isMounted) return;

      await watchJobsUntilTerminalThenReload();
    })();
  });

  onDestroy(() => {
    isMounted = false;
    clearVttRefetchTimer();
    stopJobPoller();
    lessonVideoBus.reset();
    sidePanel.closeIfScope('lesson');
  });

  const tracks = $derived(
    lessonVideoBus.transcript?.vttUrl
      ? [
          {
            kind: 'captions' as const,
            src: lessonVideoBus.transcript.vttUrl,
            srclang: lessonVideoBus.transcript.language,
            label: t.get('course.navItem.lessons.materials.tabs.video.transcript.captions_label'),
            default: false
          }
        ]
      : []
  );

  // Plyr can't add a <track> after construction, so when the captions URL
  // appears asynchronously we remount the player once. Include a stable key when
  // a transcript exists but VTT is not ready yet so optional controls (e.g. transcript panel) attach.
  const playerRemountKey = $derived.by(() => {
    if (!lessonVideoBus.transcript) return 'no-transcript';

    return lessonVideoBus.transcript.vttUrl ?? 'transcript-awaiting-vtt';
  });

  function handleFirstPlay() {
    lessonVideoBus.hasPlayed = true;

    if (hasAutoOpenedTranscript) return;
    if (!lessonVideoBus.transcript?.segments?.length) return;

    hasAutoOpenedTranscript = true;
    sidePanel.open(TRANSCRIPT_PANEL_ID);
  }

  const transcriptPanelControl = $derived(
    lessonVideoBus.transcript
      ? {
          label: t.get('course.navItem.lessons.materials.tabs.video.transcript.open_side_panel'),
          onClick: () => {
            sidePanel.open(TRANSCRIPT_PANEL_ID);
          }
        }
      : undefined
  );
</script>

<div class="w-full">
  {#key playerRemountKey}
    <MediaPlayer
      source={{
        type: video.type,
        url: video.link,
        metadata: video.metadata as { thumbnailUrl?: string; title?: string } | undefined,
        tracks
      }}
      options={{
        maxHeight: '569px',
        width: '100%',
        controls: true,
        playsinline: true,
        onTimeUpdate: (seconds) => {
          lessonVideoBus.currentTimeSeconds = seconds;
        },
        onPlayerReady: (player) => {
          lessonVideoBus.setSeekFn((seconds) => {
            player.currentTime = seconds;
          });
        },
        onFirstPlay: handleFirstPlay,
        transcriptPanelControl
      }}
    />
  {/key}
</div>
