<script lang="ts">
  import * as Block from '@cio/ui/custom/block';
  import { courseApi, lessonApi } from '$features/course/api';
  import { libraryAssetCache } from '$features/media/api';
  import VideoCardDropdown from './video-card-dropdown.svelte';
  import VideoHlsStatusBadge from './video-hls-status-badge.svelte';
  import {
    getVideoPosterUrls,
    getVideoDisplayTitle,
    getVideoDurationSeconds,
    formatVideoDuration,
    getVideoCreatedAt,
    formatVideoCreatedAt,
    type LessonVideo
  } from './video-card-utils';
  import { t } from '$lib/utils/functions/translations';
  import { getVideoMediaType } from '@cio/utils';

  interface Props {
    video: LessonVideo;
    index: number;
    isEditMode: boolean;
    isExample?: boolean;
    changeLabel?: string;
    onChange?: () => void;
    onRemove?: () => void;
    onThumbnailSaved?: (thumbnailUrl: string) => void;
    onMetadataUpdated?: (metadata: Record<string, unknown>) => void;
  }

  let {
    video,
    index,
    isEditMode,
    isExample = false,
    changeLabel,
    onChange,
    onRemove,
    onThumbnailSaved = (url) => lessonApi.updateLessonVideoThumbnail(index, url),
    onMetadataUpdated = (metadata) => lessonApi.updateLessonVideoMetadata(index, metadata)
  }: Props = $props();

  let isTranscribingForVideo = $state(false);

  const poster = $derived(getVideoPosterUrls(video));
  const title = $derived(getVideoDisplayTitle(video, index));

  let loadedAssetId = '';

  $effect(() => {
    const assetId = video.assetId;
    if (!isEditMode || isExample || !assetId || assetId === loadedAssetId) return;

    loadedAssetId = assetId;
    libraryAssetCache.ensureLoaded(assetId);
  });
  const durationSeconds = $derived(getVideoDurationSeconds(video));
  const durationFormatted = $derived(formatVideoDuration(durationSeconds ?? undefined));
  const createdAtIso = $derived(getVideoCreatedAt(video));
  const createdAtFormatted = $derived(formatVideoCreatedAt(createdAtIso ?? undefined));

  const mediaType = $derived(getVideoMediaType(video));
  const isYoutube = $derived(mediaType === 'youtube');
  const isVimeo = $derived(mediaType === 'vimeo');

  const channelLine = $derived.by(() => {
    const courseTitle = courseApi.course?.title?.trim();

    if (courseTitle) {
      return courseTitle;
    }

    return t.get('course.navItem.lessons.materials.tabs.video.simple_card.course_fallback');
  });

  const sourceKindLabel = $derived.by(() => {
    const key = isYoutube
      ? 'kind_youtube'
      : isVimeo
        ? 'kind_vimeo'
        : mediaType === 'upload'
          ? 'kind_upload'
          : mediaType === 'google_drive'
            ? 'kind_google_drive'
            : 'kind_generic';

    return t.get(`course.navItem.lessons.materials.tabs.video.simple_card.${key}`);
  });

  const hlsStatus = $derived(video.assetId ? lessonApi.videoHlsStatuses[video.assetId] : undefined);

  const metaLine = $derived.by(() => {
    if (createdAtFormatted) {
      return `${sourceKindLabel} · ${createdAtFormatted}`;
    }

    return sourceKindLabel;
  });
</script>

<!-- YouTube-like: thumbnail on top; title row + overflow menu -->
<Block.Video
  {title}
  thumbnailUrl={poster.url ?? undefined}
  fallbackThumbnailUrl={poster.fallbackUrl}
  durationLabel={durationFormatted}
  {channelLine}
  {metaLine}
  {changeLabel}
  {onChange}
  editable={isEditMode}
>
  {#snippet actions()}
    {#if isEditMode && !isExample}
      <VideoCardDropdown
        {video}
        {onRemove}
        {onThumbnailSaved}
        onHlsMetadataUpdated={onMetadataUpdated}
        onTranscribingChange={(value) => (isTranscribingForVideo = value)}
        menuPlacement="inline"
      />
    {/if}
  {/snippet}

  {#snippet notice()}
    {#if isTranscribingForVideo}
      <p class="mt-0.5 text-sm leading-snug text-orange-500">
        {$t('course.navItem.lessons.materials.tabs.video.simple_card.transcription_in_progress')}
      </p>
    {/if}
  {/snippet}

  {#snippet status()}
    <VideoHlsStatusBadge status={hlsStatus} />
  {/snippet}
</Block.Video>
