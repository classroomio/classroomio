<script lang="ts">
  import MODES from '$lib/utils/constants/mode';
  import { isOrgStudent } from '$lib/utils/store/app';
  import { t } from '$lib/utils/functions/translations';
  import BlockEditor from '$features/block/components/block-editor.svelte';
  import BlockReader from '$features/block/components/block-reader.svelte';
  import { toBlockViewModel } from '$features/block/utils/block-list-utils';
  import type { BlockEditHost, BlockVideoPlayerProps, BlockViewHost } from '$features/block/utils/types';
  import { lessonApi } from '$features/course/api';
  import { lessonBlockList } from '$features/course/store/lesson-blocks.svelte';
  import {
    DEFAULT_READING_DENSITY,
    getReadingDensitySpacingClass
  } from '$features/course/utils/lesson-reading-density';
  import LessonBlockVideoPlayer from './video/lesson-block-video-player.svelte';

  interface Props {
    mode: (typeof MODES)[keyof typeof MODES];
    courseId: string;
    lessonId: string;
    learnerView?: boolean;
  }

  let { mode, courseId, lessonId, learnerView = false }: Props = $props();

  const POLL_INTERVAL_MS = 10_000;

  const isEditing = $derived(mode === MODES.edit);
  const locale = $derived(lessonApi.currentLocale);
  const spacingClass = $derived(
    getReadingDensitySpacingClass(lessonApi.lesson?.readingDensity ?? DEFAULT_READING_DENSITY)
  );
  const viewBlocks = $derived(lessonBlockList.blocks.map((block) => toBlockViewModel(block, locale)));
  const viewHost: BlockViewHost = { videoPlayer: lessonVideoPlayer };
  const editHost = $derived<BlockEditHost>({ lessonId });
  const showsEncodingState = $derived(isEditing || $isOrgStudent !== true);
  const emptyTitle = $derived(
    learnerView
      ? $t('course.navItem.lessons.materials.blocks.empty_learner_title')
      : $t('course.navItem.lessons.materials.blocks.empty_preview_title')
  );
  const emptyDescription = $derived(
    learnerView
      ? $t('course.navItem.lessons.materials.blocks.empty_learner_description')
      : $t('course.navItem.lessons.materials.blocks.empty_preview_description', {
          editLabel: $t('course.navItem.lessons.header.mode_edit')
        })
  );

  let statusLessonId = '';
  let pollTimer: ReturnType<typeof setInterval> | undefined;

  function isEncoding() {
    return Object.values(lessonApi.videoHlsStatuses).some((status) => status === 'pending' || status === 'converting');
  }

  function stopPolling() {
    if (!pollTimer) return;

    clearInterval(pollTimer);
    pollTimer = undefined;
  }

  async function refreshVideoStatuses() {
    await lessonApi.getVideoStatuses(courseId, lessonId);

    if (!isEncoding()) {
      stopPolling();
      return;
    }

    pollTimer ??= setInterval(() => void refreshVideoStatuses(), POLL_INTERVAL_MS);
  }

  $effect(() => {
    if (!showsEncodingState || !courseId || !lessonId || lessonId === statusLessonId) return;

    statusLessonId = lessonId;
    void refreshVideoStatuses();

    return stopPolling;
  });
</script>

{#snippet lessonVideoPlayer(props: BlockVideoPlayerProps)}
  <LessonBlockVideoPlayer {...props} />
{/snippet}

{#if isEditing}
  <BlockEditor api={lessonBlockList} {locale} host={editHost} {spacingClass} />
{:else}
  <BlockReader blocks={viewBlocks} host={viewHost} {emptyTitle} {emptyDescription} {spacingClass} />
{/if}
