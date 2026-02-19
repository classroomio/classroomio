<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';
  import CopyIcon from '@lucide/svelte/icons/copy';
  import TrashIcon from '@lucide/svelte/icons/trash';

  import { t } from '$lib/utils/functions/translations';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import type { LessonVideoType } from '$features/course/utils/types';
  import { copyToClipboard, getVideoUrls, removeVideo } from '$lib/utils/functions/formatYoutubeVideo';
  import { lessonApi } from '$features/course/api';
  import { mediaManagerApi } from '$features/media-manager/api';

  import { InputField } from '@cio/ui/custom/input-field';
  import { Button } from '@cio/ui/base/button';

  interface Props {
    lessonId?: string;
  }

  let { lessonId = '' }: Props = $props();

  let youtubeLinks = $state('');
  let error = $state('');

  async function addVideo() {
    const links = getVideoUrls(youtubeLinks).map(normalizeYouTubeLink);
    const validLinks = links.filter(isValidYouTubeLink);

    if (validLinks.length === 0) {
      error = $t('course.navItem.lessons.materials.tabs.video.add_video.invalid_youtube');
    } else {
      if (!lessonApi.lesson) return;

      const existingCount = Array.isArray(lessonApi.lesson.videos) ? lessonApi.lesson.videos.length : 0;
      const newVideos = await Promise.all(
        validLinks.map(async (link = '', index) => {
          const createdAt = new Date().toISOString();
          const metadata = await mediaManagerApi.getYouTubeMetadata(link);
          const sourceUrl = metadata?.sourceUrl ?? link;
          const title = metadata?.title ?? $t('media_manager.provider.youtube');
          const videoMetadata = {
            createdAt,
            videoId: metadata?.videoId,
            title,
            thumbnailUrl: metadata?.thumbnailUrl ?? undefined,
            duration: metadata?.durationSeconds ?? undefined
          };

          const asset = await mediaManagerApi.createAsset({
            kind: 'video',
            provider: 'youtube',
            storageProvider: 'external',
            sourceUrl,
            isExternal: true,
            title,
            thumbnailUrl: metadata?.thumbnailUrl ?? undefined,
            durationSeconds: metadata?.durationSeconds ?? undefined,
            metadata: videoMetadata
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
            type: 'youtube' as LessonVideoType,
            link: sourceUrl,
            assetId: asset?.id,
            fileName: title,
            metadata: videoMetadata
          };
        })
      );

      lessonApi.updateLessonState('videos', newVideos, { append: true });
      youtubeLinks = '';
      error = '';
    }
  }

  function isValidYouTubeLink(link = '') {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

    return youtubeRegex.test(link.trim());
  }

  function normalizeYouTubeLink(link = '') {
    const trimmed = link.trim();
    if (!trimmed) {
      return trimmed;
    }

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }

    return `https://${trimmed}`;
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
