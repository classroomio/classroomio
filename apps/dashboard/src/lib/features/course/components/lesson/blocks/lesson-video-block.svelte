<script lang="ts">
  import MODES from '$lib/utils/constants/mode';
  import { isOrgStudent } from '$lib/utils/store/app';
  import { lessonApi } from '$features/course/api';
  import { lessonBlocksApi } from '$features/course/store/lesson-blocks.svelte';
  import { isExampleVideoKey, lessonVideoKey } from '$features/course/utils/lesson-blocks';
  import LessonVideoSimpleCard from '../video/lesson-video-simple-card.svelte';
  import LessonVideoPlayer from '../video/lesson-video-player.svelte';
  import VideoHlsStatusBadge from '../video/video-hls-status-badge.svelte';
  import type { LessonVideoBlock } from '$features/course/utils/types';

  type LessonVideo = NonNullable<NonNullable<typeof lessonApi.lesson>['videos']>[number];

  interface Props {
    block: LessonVideoBlock;
    mode: (typeof MODES)[keyof typeof MODES];
    courseId: string;
    lessonId: string;
    changeLabel?: string;
    onChange?: () => void;
  }

  let { block, mode, courseId, lessonId, changeLabel, onChange }: Props = $props();

  const legacyIndex = $derived(
    (lessonApi.lesson?.videos ?? []).findIndex((video) => lessonVideoKey(video) === block.sourceKey)
  );
  const legacyVideo = $derived(legacyIndex === -1 ? undefined : (lessonApi.lesson?.videos ?? [])[legacyIndex]);
  const embeddedVideo = $derived(block.data ? (block.data as unknown as LessonVideo) : undefined);
  const video = $derived(
    legacyVideo ?? embeddedVideo ?? (block.isExample ? lessonBlocksApi.getExampleVideo() : undefined)
  );
  const videoIndex = $derived(legacyIndex === -1 ? 0 : legacyIndex);
  const isExample = $derived(!legacyVideo && !embeddedVideo && block.isExample);
  const videoAssetId = $derived(video ? ((video as typeof video & { assetId?: string }).assetId ?? null) : null);
  const showsEncodingState = $derived(mode === MODES.edit || $isOrgStudent !== true);
</script>

{#if video}
  {#if mode === MODES.edit}
    <LessonVideoSimpleCard
      {video}
      index={videoIndex}
      isEditMode={true}
      isExample={isExample || isExampleVideoKey(block.sourceKey)}
      {changeLabel}
      {onChange}
    />
  {:else}
    {#if showsEncodingState && videoAssetId}
      <div class="mb-1.5 flex justify-end">
        <VideoHlsStatusBadge status={lessonApi.videoHlsStatuses[videoAssetId]} />
      </div>
    {/if}
    {#key video.type === 'upload' ? ((video as typeof video & { assetId?: string }).assetId ?? video.link) : video.link}
      <div class="w-full overflow-hidden rounded-lg">
        <LessonVideoPlayer {video} {courseId} {lessonId} {videoIndex} />
      </div>
    {/key}
  {/if}
{/if}
