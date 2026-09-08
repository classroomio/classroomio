<script lang="ts">
  import { t } from '$lib/utils/functions/translations';
  import { extractUniqueLinks, normalizeHttpUrl } from '@cio/utils';
  import { addExternalVideosToLesson } from './video-card-utils';
  import AddedVideoList from './added-video-list.svelte';

  import { InputField } from '@cio/ui/custom/input-field';
  import { Button } from '@cio/ui/base/button';

  interface Props {
    lessonId?: string;
  }

  let { lessonId = '' }: Props = $props();

  let genericLinks = $state('');
  let error = $state('');
  let isSubmitting = $state(false);

  function isValidLink(link = ''): boolean {
    const trimmed = link.trim();
    if (!trimmed) return false;

    try {
      const url = new URL(
        trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`
      );
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  async function addVideo() {
    if (isSubmitting) return;

    const dedupedValidLinks = extractUniqueLinks(genericLinks, (link) =>
      isValidLink(link) ? normalizeHttpUrl(link) : null
    );

    if (dedupedValidLinks.length === 0) {
      error = $t('course.navItem.lessons.materials.tabs.video.add_video.invalid_link');

      return;
    }

    isSubmitting = true;

    try {
      await addExternalVideosToLesson({
        links: dedupedValidLinks,
        type: 'generic',
        lessonId
      });

      genericLinks = '';
      error = '';
    } catch (err) {
      error = typeof err === 'string' ? err : (err as Error)?.message || 'Failed to add video';
    } finally {
      isSubmitting = false;
    }
  }

  function handleInputChange() {
    if (error) {
      error = '';
    }
  }
</script>

<form
  class="flex w-full items-end justify-between gap-4"
  onsubmit={(event) => {
    event.preventDefault();
    void addVideo();
  }}
>
  <InputField
    label={$t('course.navItem.lessons.materials.tabs.video.embed_link')}
    bind:value={genericLinks}
    className="flex-1"
    isDisabled={isSubmitting}
    oninput={handleInputChange}
    onchange={handleInputChange}
    onInputChange={handleInputChange}
    placeholder="https://www.videoplayer.com/"
    errorMessage={error}
  />
  <Button type="submit" disabled={isSubmitting}>
    {$t('course.navItem.lessons.materials.tabs.video.add_video.add_video')}
  </Button>
</form>

<AddedVideoList type="generic" />
