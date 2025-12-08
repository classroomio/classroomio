<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';
  import CopyIcon from '@lucide/svelte/icons/copy';
  import TrashIcon from '@lucide/svelte/icons/trash';

  import { t } from '$lib/utils/functions/translations';
  import { IconButton } from '$lib/components/IconButton';
  import type { LessonVideoType } from '$lib/utils/types';
  import { copyToClipboard, getVideoUrls, removeVideo } from '$lib/utils/functions/formatYoutubeVideo';
  import { lesson, isLessonDirty } from '$lib/components/Course/components/Lesson/store/lessons';

  import TextField from '$lib/components/Form/TextField.svelte';
  import { Button } from '@cio/ui/base/button';

  let youtubeLinks = $state('');
  let error = $state('');

  function addVideo() {
    const links = getVideoUrls(youtubeLinks);
    const validLinks = links.filter(isValidYouTubeLink);

    if (validLinks.length === 0) {
      error = $t('course.navItem.lessons.materials.tabs.video.add_video.invalid_youtube');
    } else {
      const existingLinks = $lesson?.materials?.videos || [];

      $lesson.materials.videos = [
        ...existingLinks,
        ...validLinks.map((link = '') => ({
          type: 'youtube' as LessonVideoType,
          link,
          metadata: {}
        }))
      ];
      youtubeLinks = '';
      error = '';
    }
  }

  function isValidYouTubeLink(link = '') {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

    return youtubeRegex.test(link.trim());
  }
</script>

<div class="flex w-full items-{error ? 'center' : 'end'} justify-between gap-5">
  <TextField
    label={$t('course.navItem.lessons.materials.tabs.video.add_video.youtube_link')}
    bind:value={youtubeLinks}
    className="flex-1 text-left "
    inputClassName="text-sm"
    onChange={() => ($isLessonDirty = true)}
    placeholder="https://www.youtube.com/watch?v="
    errorMessage={error}
  />
  <Button
    onclick={addVideo}
  >
    {$t('course.navItem.lessons.materials.tabs.video.add_video.add_video')}
  </Button>
</div>
<p class="mt-4 pl-2 text-sm">
  {$t('course.navItem.lessons.materials.tabs.video.add_video.videos_added')}:
  <strong>
    {$lesson?.materials?.videos.filter((v) => v.type === 'youtube' && isValidYouTubeLink(v.link)).length || 0}
  </strong>
</p>
<div class="">
  {#each $lesson?.materials?.videos as video, index}
    {#if video.type === 'youtube'}
      <div class="flex items-center gap-1">
        <Badge class="max-w-md truncate" variant="secondary">
          {video.link}
        </Badge>
        <IconButton value="copy-video" onClick={() => copyToClipboard(video.link)}>
          <CopyIcon size={16} />
        </IconButton>
        <IconButton value="delete-video" onClick={() => removeVideo(index)}>
          <TrashIcon size={16} />
        </IconButton>
      </div>
    {/if}
  {/each}
</div>
