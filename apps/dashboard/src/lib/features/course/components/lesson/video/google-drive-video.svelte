<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';
  import CopyIcon from '@lucide/svelte/icons/copy';
  import TrashIcon from '@lucide/svelte/icons/trash';

  import { t } from '$lib/utils/functions/translations';
  import type { Lesson, LessonVideoType } from '$features/course/utils/types';
  import type { TAssetProvider } from '@cio/utils/validation/assets';
  import { lessonApi } from '$features/course/api';
  import { mediaApi } from '$features/media/api';
  import { copyToClipboard, removeVideo } from '$lib/utils/functions/formatYoutubeVideo';
  import {
    googleDrivePreviewUrl,
    googleDriveThumbnailUrl,
    pickGoogleDriveVideo
  } from '$lib/utils/functions/google-drive-picker';

  import { IconButton } from '@cio/ui/custom/icon-button';
  import { Button } from '@cio/ui/base/button';
  import { env } from '$env/dynamic/public';

  interface Props {
    lessonId?: string;
  }

  let { lessonId = '' }: Props = $props();

  let isOpeningPicker = $state(false);
  let errorMessage = $state('');

  const clientId = $derived((env.PUBLIC_GOOGLE_PICKER_CLIENT_ID ?? '').trim());
  const apiKey = $derived((env.PUBLIC_GOOGLE_PICKER_API_KEY ?? '').trim());
  const isConfigured = $derived(Boolean(clientId && apiKey));

  function isGoogleDriveLessonVideo(video: NonNullable<Lesson['videos']>[number]): boolean {
    return (video as { type: string }).type === 'google_drive';
  }

  async function openPicker() {
    errorMessage = '';

    if (!isConfigured) {
      errorMessage = $t('course.navItem.lessons.materials.tabs.video.add_video.google_drive_not_configured');
      return;
    }

    if (!lessonApi.lesson) return;

    isOpeningPicker = true;

    try {
      const picked = await pickGoogleDriveVideo({ clientId, apiKey });

      if (!picked) {
        return;
      }

      const previewUrl = googleDrivePreviewUrl(picked.fileId);
      const thumbnailUrl = googleDriveThumbnailUrl(picked.fileId);
      const createdAt = new Date().toISOString();
      const videoMetadata = {
        createdAt,
        title: picked.name,
        googleDriveFileId: picked.fileId,
        mimeType: picked.mimeType,
        thumbnailUrl
      };

      const existingCount = Array.isArray(lessonApi.lesson.videos) ? lessonApi.lesson.videos.length : 0;

      const asset = await mediaApi.createAsset({
        kind: 'video',
        provider: 'google_drive' as TAssetProvider,
        storageProvider: 'external',
        storageKey: picked.fileId,
        sourceUrl: previewUrl,
        isExternal: true,
        title: picked.name,
        thumbnailUrl,
        metadata: videoMetadata
      });

      if (asset && lessonId) {
        await mediaApi.attachAsset(asset.id, {
          targetType: 'lesson',
          targetId: lessonId,
          slotType: 'lesson_video',
          position: existingCount
        });
      }

      const newVideo = {
        type: 'google_drive' as LessonVideoType,
        link: previewUrl,
        assetId: asset?.id,
        fileName: picked.name,
        metadata: videoMetadata
      };

      lessonApi.updateLessonState('videos', [newVideo as unknown as NonNullable<Lesson['videos']>[number]], {
        append: true
      });
      lessonApi.isDirty = true;
    } catch (error) {
      console.error('Google Drive picker error:', error);
      errorMessage = $t('course.navItem.lessons.materials.tabs.video.add_video.google_drive_error');
    } finally {
      isOpeningPicker = false;
    }
  }
</script>

<div class="flex flex-col gap-3">
  <p class="ui:text-muted-foreground text-sm">
    {$t('course.navItem.lessons.materials.tabs.video.add_video.google_drive_hint')}
  </p>

  <Button type="button" onclick={openPicker} disabled={isOpeningPicker} class="w-fit">
    {isOpeningPicker
      ? $t('course.navItem.lessons.materials.tabs.video.add_video.google_drive_opening')
      : $t('course.navItem.lessons.materials.tabs.video.add_video.google_drive_choose')}
  </Button>

  {#if errorMessage}
    <p class="ui:text-destructive text-sm">{errorMessage}</p>
  {/if}
</div>

<p class="mt-4 pl-2 text-sm">
  {$t('course.navItem.lessons.materials.tabs.video.add_video.videos_added')}:
  <strong>
    {lessonApi.lesson?.videos?.filter(isGoogleDriveLessonVideo).length || 0}
  </strong>
</p>

<div class="">
  {#each lessonApi.lesson?.videos || [] as video, index (video.assetId ?? `${video.type}-${index}-${video.link}`)}
    {#if isGoogleDriveLessonVideo(video)}
      <div class="flex items-center gap-1">
        <Badge class="max-w-md truncate" variant="secondary">
          {video.fileName || video.link}
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
