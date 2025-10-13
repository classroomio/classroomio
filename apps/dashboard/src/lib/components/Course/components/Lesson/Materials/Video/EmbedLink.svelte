<script lang="ts">
  import type { LessonVideoType } from '$lib/utils/types';
  import { isLessonDirty, lesson } from '$lib/components/Course/components/Lesson/store/lessons';
  import TextField from '$lib/components/Form/TextField.svelte';
  import { IconButton } from '$lib/components/IconButton';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { CopyButton, Tag } from 'carbon-components-svelte';
  import TrashIcon from '@lucide/svelte/icons/trash';

  let genericLinks = $state('');
  let error = $state('');

  function getVideoUrls(urls = '') {
    return (urls || '').split(',').filter((url) => !!url.trim());
  }

  function addVideo() {
    const links = getVideoUrls(genericLinks);
    const validLinks = links.filter(isValidLink);

    if (validLinks.length === 0) {
      error = $t('course.navItem.lessons.materials.tabs.video.add_video.invalid_link');
    } else {
      const existingLinks = $lesson?.materials?.videos || [];

      $lesson.materials.videos = [
        ...existingLinks,
        ...validLinks.map((link = '') => ({
          type: 'generic' as LessonVideoType,
          link,
          metadata: {}
        }))
      ];
      genericLinks = '';
      error = '';
    }
  }

  function isValidLink(link = '') {
    // Basic URL validation
    if (!link) return false;

    try {
      const url = new URL(link.trim());
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      // If URL construction fails, try prepending https://
      try {
        return !!new URL(`https://${link.trim()}`);
      } catch {
        return false;
      }
    }
  }

  function removeVideo(index = 0) {
    $lesson.materials.videos = $lesson.materials.videos.filter((_v, i) => i !== index);
  }
</script>

<div class="flex w-full items-{error ? 'center' : 'end'} justify-between gap-5">
  <TextField
    label={$t('course.navItem.lessons.materials.tabs.video.embed_link')}
    bind:value={genericLinks}
    className="flex-1 text-left "
    inputClassName="text-sm"
    onChange={() => ($isLessonDirty = true)}
    placeholder="https://www.videoplayer.com/"
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
    {$lesson?.materials?.videos.filter((v) => v.type === 'generic').length || 0}
  </strong>
</p>
<div class="">
  {#each $lesson?.materials?.videos as video, index}
    {#if video.type === 'generic'}
      <div class="flex items-center gap-1">
        <Tag type="blue">
          {video.link}
        </Tag>
        <CopyButton text={video.link} feedback="Copied to clipboard" />
        <IconButton value="delete-video" onClick={() => removeVideo(index)}>
          <TrashIcon />
        </IconButton>
      </div>
    {/if}
  {/each}
</div>
