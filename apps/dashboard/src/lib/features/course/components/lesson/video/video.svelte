<script lang="ts">
  import { lessonApi } from '$features/course/api';
  import { DeleteModal } from '$features/ui';
  import { Button } from '@cio/ui/base/button';
  import { Empty } from '@cio/ui/custom/empty';
  import * as Item from '@cio/ui/base/item';
  import { lessonVideoUpload } from '$features/course/components/lesson/store';
  import { t } from '$lib/utils/functions/translations';
  import MODES from '$lib/utils/constants/mode';
  import VideoIcon from '@lucide/svelte/icons/video';
  import LessonVideoSimpleCard from './lesson-video-simple-card.svelte';
  import LessonVideoPlayer from './lesson-video-player.svelte';

  interface Props {
    mode?: (typeof MODES)[keyof typeof MODES];
    courseId: string;
    lessonId: string;
  }

  let { mode = MODES.view, courseId, lessonId }: Props = $props();

  const videos = $derived(lessonApi.lesson?.videos || []);

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
</script>

{#snippet content(video, index)}
  {#key video.type === 'upload' ? ((video as typeof video & { assetId?: string }).assetId ?? video.link) : video.link}
    <LessonVideoPlayer {video} {courseId} {lessonId} showSummarizeButton={index === videos.length - 1} />
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
          {@render content(video, index)}
        </div>
      {/each}
    </div>
  {/if}
{/if}
