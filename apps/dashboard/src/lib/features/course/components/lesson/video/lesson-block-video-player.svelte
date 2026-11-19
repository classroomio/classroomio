<script lang="ts">
  import { isOrgStudent } from '$lib/utils/store/app';
  import { lessonApi } from '$features/course/api';
  import type { BlockVideoPlayerProps } from '$features/block/utils/types';
  import LessonVideoPlayer from './lesson-video-player.svelte';
  import VideoHlsStatusBadge from './video-hls-status-badge.svelte';
  import type { LessonVideo } from './video-card-utils';

  let { block, index }: BlockVideoPlayerProps = $props();

  const video = $derived(block.data as LessonVideo);
  const courseId = $derived(lessonApi.lesson?.courseId ?? '');
  const lessonId = $derived(lessonApi.lesson?.id ?? '');
  const showsEncodingState = $derived($isOrgStudent !== true);
</script>

{#if showsEncodingState && video.assetId}
  <div class="mb-1.5 flex justify-end">
    <VideoHlsStatusBadge status={lessonApi.videoHlsStatuses[video.assetId]} />
  </div>
{/if}

{#key video.type === 'upload' ? (video.assetId ?? video.link) : video.link}
  <div class="w-full overflow-hidden rounded-lg">
    <LessonVideoPlayer {video} {courseId} {lessonId} videoIndex={index} />
  </div>
{/key}
