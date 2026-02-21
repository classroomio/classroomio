<script lang="ts">
  import { lessonApi } from '$features/course/api';
  import { MediaPlayer } from '$features/ui';
  import { DeleteModal } from '$features/ui';
  import { Button } from '@cio/ui/base/button';
  import { Empty } from '@cio/ui/custom/empty';
  import * as Item from '@cio/ui/base/item';
  import { lessonVideoUpload } from '$features/course/components/lesson/store';
  import { t } from '$lib/utils/functions/translations';
  import MODES from '$lib/utils/constants/mode';
  import VideoIcon from '@lucide/svelte/icons/video';
  import VideoCard from './video-card.svelte';

  interface Props {
    mode?: (typeof MODES)[keyof typeof MODES];
  }

  let { mode = MODES.view }: Props = $props();

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

{#snippet content(video)}
  {#key video.link}
    <MediaPlayer
      source={{
        type: video.type,
        url: video.link,
        metadata: video.metadata
      }}
      options={{
        maxHeight: '569px',
        width: '100%',
        controls: true,
        playsinline: true
      }}
    />
  {/key}
{/snippet}

{#if mode === MODES.edit}
  <!-- Edit Mode: grid of video cards with remove + delete confirmation -->
  <Button onclick={openAddVideoModal} class="float-end my-4">
    {$t('course.navItem.lessons.materials.tabs.video.button')}
  </Button>

  {#if videos.length}
    <Item.Group class="grid! w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {#each videos as video, index}
        <VideoCard {video} {index} isEditMode={true} onRemove={() => requestRemoveVideo(index)} />
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
      {#each videos as video}
        <div class="mb-5 w-full overflow-hidden">
          {@render content(video)}
        </div>
      {/each}
    </div>
  {/if}
{/if}
