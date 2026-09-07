<script lang="ts">
  import { t } from '$lib/utils/functions/translations';
  import { VimeoLinkForm } from '@cio/ui/custom/vimeo-link-form';
  import { addExternalVideosToLesson } from './video-card-utils';
  import AddedVideoList from './added-video-list.svelte';

  interface Props {
    lessonId?: string;
  }

  let { lessonId = '' }: Props = $props();

  async function addVideo(validLinks: string[]) {
    const fallbackTitle = $t('media_manager.provider.vimeo');
    await addExternalVideosToLesson({
      links: validLinks,
      type: 'vimeo',
      lessonId,
      fallbackTitle
    });
  }
</script>

<VimeoLinkForm
  inputLabel={$t('course.navItem.lessons.materials.tabs.video.add_video.vimeo_link')}
  inputPlaceholder={$t('course.navItem.lessons.materials.tabs.video.add_video.vimeo_link')}
  addButtonLabel={$t('course.navItem.lessons.materials.tabs.video.add_video.add_video')}
  invalidVimeoMessage={$t('course.navItem.lessons.materials.tabs.video.add_video.invalid_vimeo')}
  privacyHintPrefix={$t('course.navItem.lessons.materials.tabs.video.add_video.vimeo_privacy_hint_prefix')}
  privacyHintSuffix={$t('course.navItem.lessons.materials.tabs.video.add_video.vimeo_privacy_hint_suffix')}
  onSubmit={addVideo}
/>

<AddedVideoList type="vimeo" />
