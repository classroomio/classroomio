<script lang="ts">
  import { lessonApi } from '$features/course/api';
  import { DeleteModal } from '$features/ui';
  import { Button } from '@cio/ui/base/button';
  import { Empty } from '@cio/ui/custom/empty';
  import * as Item from '@cio/ui/base/item';
  import { lessonVideoUpload } from '$features/course/components/lesson/store';
  import LessonMaterialActions from '$features/course/components/lesson/lesson-material-actions.svelte';
  import { sidePanel } from '$features/side-panel';
  import { t } from '$lib/utils/functions/translations';
  import MODES from '$lib/utils/constants/mode';
  import VideoIcon from '@lucide/svelte/icons/video';
  import LessonVideoSimpleCard from './lesson-video-simple-card.svelte';
  import LessonVideoPlayer from './lesson-video-player.svelte';
  import { lessonVideoBus } from './lesson-video-bus.svelte';
  import VideoHlsStatusBadge from './video-hls-status-badge.svelte';
  import { isOrgStudent } from '$lib/utils/store/app';
  import { TRANSCRIPT_PANEL_ID } from './transcript-panel-definition';

  interface Props {
    mode?: (typeof MODES)[keyof typeof MODES];
    courseId: string;
    lessonId: string;
  }

  let { mode = MODES.view, courseId, lessonId }: Props = $props();

  const videos = $derived(lessonApi.lesson?.videos || []);

  const POLL_INTERVAL_MS = 10_000;

  let statusLessonId = $state('');
  let pollTimer: ReturnType<typeof setInterval> | undefined;

  function isEncoding() {
    return Object.values(lessonApi.videoHlsStatuses).some((status) => status === 'pending' || status === 'converting');
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = undefined;
    }
  }

  async function refreshVideoStatuses() {
    await lessonApi.getVideoStatuses(courseId, lessonId);

    // Encoding runs for minutes, so keep checking until nothing is in flight —
    // then stop, rather than polling an idle lesson forever.
    if (!isEncoding()) {
      stopPolling();
      return;
    }

    pollTimer ??= setInterval(() => void refreshVideoStatuses(), POLL_INTERVAL_MS);
  }

  // Staff see encoding state wherever they look at the lesson. A learner never
  // does: the video plays either way, so the state is theirs to act on, not
  // theirs to worry about.
  const showsEncodingState = $derived(mode === MODES.edit || $isOrgStudent !== true);

  $effect(() => {
    if (!showsEncodingState || !courseId || !lessonId || lessonId === statusLessonId) return;

    statusLessonId = lessonId;
    void refreshVideoStatuses();

    return stopPolling;
  });

  const hasTranscript = $derived.by(() => {
    lessonVideoBus.transcriptSources;
    return lessonVideoBus.hasTranscriptAvailable();
  });

  let openDeleteVideoModal = $state(false);
  let videoIndexToDelete = $state<number | null>(null);

  const openAddVideoModal = () => {
    $lessonVideoUpload.isModalOpen = true;
  };

  function requestRemoveVideo(index: number) {
    videoIndexToDelete = index;
    openDeleteVideoModal = true;
  }

  function confirmRemoveVideo() {
    if (videoIndexToDelete !== null) {
      lessonApi.deleteLessonVideo(videoIndexToDelete);
      videoIndexToDelete = null;
    }
    openDeleteVideoModal = false;
  }

  function openTranscriptPanel() {
    if (!lessonVideoBus.prepareTranscriptPanelSelection()) return;

    sidePanel.open(TRANSCRIPT_PANEL_ID);
  }
</script>

{#snippet content(video, index)}
  {#key video.type === 'upload' ? ((video as typeof video & { assetId?: string }).assetId ?? video.link) : video.link}
    <LessonVideoPlayer {video} {courseId} {lessonId} videoIndex={index} />
  {/key}
{/snippet}

{#if mode === MODES.edit}
  <!-- Edit Mode: grid of video cards with remove + delete confirmation -->
  <Button onclick={openAddVideoModal} class="float-end my-4">
    {$t('course.navItem.lessons.materials.tabs.video.button')}
  </Button>

  {#if videos.length}
    <!--
      `auto-fill` + `minmax(200px, 1fr)` packs as many columns as fit while
      each card stays at least 200px wide. Unlike `auto-fit`, empty tracks
      are kept — so a single card on a wide container stays slim instead
      of stretching across the full row. As the container narrows
      (e.g. the transcript side panel opens) the grid drops columns
      naturally instead of squeezing the cards.
    -->
    <Item.Group class="grid! w-full grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-x-5 gap-y-8">
      {#each videos as video, index}
        <LessonVideoSimpleCard {video} {index} isEditMode={true} onRemove={() => requestRemoveVideo(index)} />
      {/each}
    </Item.Group>
  {:else}
    <Empty
      title={$t('course.navItem.lessons.materials.tabs.video.empty_title')}
      description={$t('course.navItem.lessons.materials.tabs.video.empty_description')}
      icon={VideoIcon}
    />
  {/if}

  <DeleteModal bind:open={openDeleteVideoModal} onDelete={confirmRemoveVideo} />
{:else}
  <!-- View Mode -->
  {#if videos.length}
    <div class="w-full">
      {#each videos as video, index}
        <div class="{index < videos.length - 1 ? 'mb-5' : ''} w-full overflow-hidden">
          {#if showsEncodingState && video.assetId}
            <div class="mb-1.5 flex justify-end">
              <VideoHlsStatusBadge status={lessonApi.videoHlsStatuses[video.assetId]} />
            </div>
          {/if}
          {@render content(video, index)}
        </div>
      {/each}

      <LessonMaterialActions
        showTranscript={hasTranscript}
        showSummarize={videos.length > 0}
        showTakeNote={videos.length > 0}
        {courseId}
        {lessonId}
        onTranscript={openTranscriptPanel}
      />
    </div>
  {/if}
{/if}
