<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';
  import CopyIcon from '@lucide/svelte/icons/copy';
  import TrashIcon from '@lucide/svelte/icons/trash';

  import { t } from '$lib/utils/functions/translations';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import type { LessonVideoType } from '$features/course/utils/types';
  import { copyToClipboard, getVideoUrls, removeVideo } from '$lib/utils/functions/formatYoutubeVideo';
  import { lessonApi } from '$features/course/api';

  import { InputField } from '@cio/ui/custom/input-field';
  import { Button } from '@cio/ui/base/button';

  let youtubeLinks = $state('');
  let error = $state('');

  function addVideo() {
    const links = getVideoUrls(youtubeLinks);
    const validLinks = links.filter(isValidYouTubeLink);

    if (validLinks.length === 0) {
      error = $t('course.navItem.lessons.materials.tabs.video.add_video.invalid_youtube');
    } else {
      if (!lessonApi.lesson) return;

      const newVideos = validLinks.map((link = '') => ({
        type: 'youtube' as LessonVideoType,
        link,
        metadata: { createdAt: new Date().toISOString() } as { svid?: string; createdAt?: string }
      }));

      lessonApi.updateLessonState('videos', newVideos, { append: true });
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
  <InputField
    label={$t('course.navItem.lessons.materials.tabs.video.add_video.youtube_link')}
    bind:value={youtubeLinks}
    className="flex-1 text-left"
    onchange={() => (lessonApi.isDirty = true)}
    placeholder="https://www.youtube.com/watch?v="
    errorMessage={error}
  />
  <Button onclick={addVideo}>
    {$t('course.navItem.lessons.materials.tabs.video.add_video.add_video')}
  </Button>
</div>
<p class="mt-4 pl-2 text-sm">
  {$t('course.navItem.lessons.materials.tabs.video.add_video.videos_added')}:
  <strong>
    {lessonApi.lesson?.videos?.filter((v) => v.type === 'youtube' && isValidYouTubeLink(v.link)).length || 0}
  </strong>
</p>
<div class="">
  {#each lessonApi.lesson?.videos || [] as video, index}
    {#if video.type === 'youtube'}
      <div class="flex items-center gap-1">
        <Badge class="max-w-md truncate" variant="secondary">
          {video.link}
        </Badge>
        <IconButton onclick={() => copyToClipboard(video.link)}>
          <CopyIcon size={16} />
        </IconButton>
        <IconButton onclick={() => removeVideo(index)}>
          <TrashIcon size={16} />
        </IconButton>
      </div>
    {/if}
  {/each}
</div>
