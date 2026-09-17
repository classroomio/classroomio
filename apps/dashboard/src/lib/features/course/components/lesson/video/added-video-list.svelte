<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import CopyIcon from '@lucide/svelte/icons/copy';
  import TrashIcon from '@lucide/svelte/icons/trash';
  import { t } from '$lib/utils/functions/translations';
  import { lessonApi } from '$features/course/api';
  import { snackbar } from '$features/ui/snackbar/store';
  import type { LessonVideoType } from './video-card-utils';

  interface Props {
    type: LessonVideoType;
  }

  let { type }: Props = $props();

  const matchingVideos = $derived.by(() => {
    const list = Array.isArray(lessonApi.lesson?.videos) ? lessonApi.lesson.videos : [];
    return list
      .map((video, index) => ({ video, index }))
      .filter(({ video }) => video.type === type && Boolean(video.link));
  });

  async function handleCopy(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      snackbar.success('snackbar.people.success.copied');
    } catch {
      snackbar.error('snackbar.public_course.url_copy_failed');
    }
  }

  function handleRemove(index: number) {
    lessonApi.deleteLessonVideo(index);
  }
</script>

<p class="mt-4 pl-2 text-sm">
  {$t('course.navItem.lessons.materials.tabs.video.add_video.videos_added')}:
  <strong>{matchingVideos.length}</strong>
</p>

<div class="mt-2 space-y-1">
  {#each matchingVideos as { video, index } (video.assetId || `${video.link}-${index}`)}
    <div class="flex max-w-full min-w-0 items-center gap-1">
      <Badge
        class="max-w-50 min-w-0 shrink truncate sm:max-w-xs md:max-w-sm lg:max-w-md"
        variant="secondary"
        title={video.fileName || video.link}
      >
        <span class="truncate">{video.fileName || video.link}</span>
      </Badge>
      <IconButton
        class="shrink-0"
        onclick={() => handleCopy(video.link)}
        aria-label={$t('course.view_as_student.copy_link')}
      >
        <CopyIcon size={16} />
      </IconButton>
      <IconButton class="shrink-0" onclick={() => handleRemove(index)} aria-label={$t('common.delete')}>
        <TrashIcon size={16} />
      </IconButton>
    </div>
  {/each}
</div>
