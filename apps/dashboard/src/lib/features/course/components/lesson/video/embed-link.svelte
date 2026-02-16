<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';
  import CopyIcon from '@lucide/svelte/icons/copy';
  import TrashIcon from '@lucide/svelte/icons/trash';

  import { t } from '$lib/utils/functions/translations';
  import type { LessonVideoType } from '$features/course/utils/types';
  import { lessonApi } from '$features/course/api';
  import { mediaManagerApi } from '$features/media-manager/api';
  import { copyToClipboard, getVideoUrls, removeVideo } from '$lib/utils/functions/formatYoutubeVideo';

  import { IconButton } from '@cio/ui/custom/icon-button';
  import { InputField } from '@cio/ui/custom/input-field';
  import { Button } from '@cio/ui/base/button';

  interface Props {
    lessonId?: string;
  }

  let { lessonId = '' }: Props = $props();

  let genericLinks = $state('');
  let error = $state('');

  async function addVideo() {
    const links = getVideoUrls(genericLinks);
    const validLinks = links.filter(isValidLink);

    if (validLinks.length === 0) {
      error = $t('course.navItem.lessons.materials.tabs.video.add_video.invalid_link');
    } else {
      if (!lessonApi.lesson) return;

      const existingCount = Array.isArray(lessonApi.lesson.videos) ? lessonApi.lesson.videos.length : 0;
      const newVideos = await Promise.all(
        validLinks.map(async (link = '', index) => {
          const createdAt = new Date().toISOString();
          const asset = await mediaManagerApi.createAsset({
            kind: 'video',
            provider: 'generic',
            storageProvider: 'external',
            sourceUrl: link,
            isExternal: true,
            title: link,
            metadata: { createdAt }
          });

          if (asset && lessonId) {
            await mediaManagerApi.attachAsset(asset.id, {
              targetType: 'lesson',
              targetId: lessonId,
              slotType: 'lesson_video',
              position: existingCount + index
            });
          }

          return {
            type: 'generic' as LessonVideoType,
            link,
            assetId: asset?.id,
            metadata: { createdAt } as { svid?: string; createdAt?: string }
          };
        })
      );

      lessonApi.updateLessonState('videos', newVideos, { append: true });
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
</script>

<div class="flex w-full items-{error ? 'center' : 'end'} justify-between gap-5">
  <InputField
    label={$t('course.navItem.lessons.materials.tabs.video.embed_link')}
    bind:value={genericLinks}
    className="flex-1"
    onchange={() => (lessonApi.isDirty = true)}
    placeholder="https://www.videoplayer.com/"
    errorMessage={error}
  />
  <Button onclick={addVideo}>
    {$t('course.navItem.lessons.materials.tabs.video.add_video.add_video')}
  </Button>
</div>
<p class="mt-4 pl-2 text-sm">
  {$t('course.navItem.lessons.materials.tabs.video.add_video.videos_added')}:
  <strong>
    {lessonApi.lesson?.videos?.filter((v) => v.type === 'generic').length || 0}
  </strong>
</p>
<div class="">
  {#each lessonApi.lesson?.videos || [] as video, index}
    {#if video.type === 'generic'}
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
