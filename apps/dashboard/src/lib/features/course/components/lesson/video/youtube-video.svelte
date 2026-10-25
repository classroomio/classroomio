<script lang="ts">
  import { t } from '$lib/utils/functions/translations';
  import { YoutubeLinkForm } from '@cio/ui/custom/youtube-link-form';
  import { addExternalVideosToLesson } from './video-card-utils';
  import AddedVideoList from './added-video-list.svelte';

  interface Props {
    lessonId?: string;
    onAdded?: () => void;
  }

  let { lessonId = '', onAdded = () => {} }: Props = $props();

  async function addVideo(validLinks: string[]) {
    const addedCount = await addExternalVideosToLesson({
      links: validLinks,
      type: 'youtube',
      lessonId,
      fallbackTitle: 'YouTube'
    });

    if (addedCount > 0) onAdded();
  }
</script>

<YoutubeLinkForm
  inputLabel={$t('course.navItem.lessons.materials.tabs.video.add_video.youtube_link')}
  inputPlaceholder={$t('course.navItem.lessons.materials.tabs.video.add_video.youtube_link')}
  addButtonLabel={$t('course.navItem.lessons.materials.tabs.video.add_video.add_video')}
  invalidYoutubeMessage={$t('course.navItem.lessons.materials.tabs.video.add_video.invalid_youtube')}
  onSubmit={addVideo}
/>

<AddedVideoList type="youtube" {lessonId} />
