<script lang="ts">
  import { CopyButton, Tag } from 'carbon-components-svelte';
  import TrashCanIcon from 'carbon-icons-svelte/lib/TrashCan.svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import { lesson, isLessonDirty } from '$lib/components/Course/components/Lesson/store/lessons';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { t } from '$lib/utils/functions/translations';
  import type { LessonVideoType } from '$lib/utils/types';

  let youtubeLinks = $state('');
  let error = $state('');

  function getVideoUrls(urls = '') {
    return (urls || '').split(',').filter((url) => !!url.trim());
  }

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
    const youtubeRegex =
      /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

    return youtubeRegex.test(link.trim());
  }

  function removeVideo(index = 0) {
    $lesson.materials.videos = $lesson.materials.videos.filter((v, i) => i !== index);
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
  <PrimaryButton
    label={$t('course.navItem.lessons.materials.tabs.video.add_video.add_video')}
    className="rounded-md"
    onClick={addVideo}
  />
</div>
<p class="mt-4 pl-2 text-sm">
  {$t('course.navItem.lessons.materials.tabs.video.add_video.videos_added')}:
  <strong>
    {$lesson?.materials?.videos.filter((v) => v.type === 'youtube' && isValidYouTubeLink(v.link))
      .length || 0}
  </strong>
</p>
<div class="">
  {#each $lesson?.materials?.videos as video, index}
    {#if video.type === 'youtube'}
      <div class="flex items-center gap-1">
        <Tag type="blue">
          {video.link}
        </Tag>
        <CopyButton text={video.link} feedback="Copied to clipboard" />
        <IconButton value="delete-video" onClick={() => removeVideo(index)}>
          <TrashCanIcon size={16} class="carbon-icon dark:text-white" />
        </IconButton>
      </div>
    {/if}
  {/each}
</div>
