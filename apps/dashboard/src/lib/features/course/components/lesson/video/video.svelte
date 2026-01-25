<script lang="ts">
  import { lessonApi } from '$features/course/api';
  import { MediaPlayer } from '$features/ui';
  import { Button } from '@cio/ui/base/button';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import TrashIcon from '@lucide/svelte/icons/trash';
  import { lessonVideoUpload } from '$features/course/components/lesson/store/lessons';
  import { t } from '$lib/utils/functions/translations';
  import MODES from '$lib/utils/constants/mode';

  interface Props {
    mode?: (typeof MODES)[keyof typeof MODES];
  }

  let { mode = MODES.view }: Props = $props();

  const videos = $derived(lessonApi.lesson?.videos || []);

  const openAddVideoModal = () => {
    $lessonVideoUpload.isModalOpen = true;
  };
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
  <!-- Edit Mode -->
  <Button onclick={openAddVideoModal} class="mb-2">
    {$t('course.navItem.lessons.materials.tabs.video.button')}
  </Button>

  <div class="flex h-full w-full flex-col items-start">
    {#each videos as video, index}
      <div class="mb-4 w-full">
        <div class="mb-2 ml-auto">
          <IconButton onclick={() => lessonApi.deleteLessonVideo(index)}>
            <TrashIcon size={16} />
          </IconButton>
        </div>
        <div class="flex h-full w-full flex-col gap-2 overflow-hidden">
          {@render content(video)}
        </div>
      </div>
    {/each}
  </div>
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
