<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import { CircleCheckIcon } from '$features/ui/icons';
  import { Button } from '@cio/ui/base/button';
  import * as Tooltip from '@cio/ui/base/tooltip';
  import { PercentRingProgress } from '@cio/ui/custom/percent-ring-progress';
  import { isOrgStudent } from '$lib/utils/store/app';
  import { t } from '$lib/utils/functions/translations';
  import { courseApi, lessonApi } from '$features/course/api';
  import { getOrderedNavigableContent, getContentRoute } from '$features/course/utils/content';
  import { ContentType } from '@cio/utils/constants/content';
  import { snackbar } from '$features/ui/snackbar/store';
  import type { CourseContentItem } from '$features/course/utils/types';
  import {
    openCourseCompletionModal,
    updateCourseCompletionModal,
    closeCourseCompletionModal
  } from '$features/course/store/course-completion-modal';
  import { updateLessonCompletionInCourseContent } from '$features/course/utils/content-completion';

  interface Props {
    lessonId?: string;
    courseId: string;
    /** When on an exercise page, pass this to show prev/next content in content order (no mark-complete). */
    exerciseId?: string;
  }

  let { lessonId, courseId, exerciseId }: Props = $props();

  let isMarkingComplete = $state(false);

  const navigableContentItems = $derived(getOrderedNavigableContent(courseApi.course));

  const lessonItems = $derived(navigableContentItems.filter((item) => item.type === ContentType.Lesson));

  /** Prev/next content items in full content order (immediate neighbors; locked content is hidden in the UI so we don't skip). */
  const prevNextContent = $derived.by(() => {
    const currentId = lessonId ?? exerciseId;
    const currentType = lessonId ? ContentType.Lesson : ContentType.Exercise;
    if (!currentId) return { prev: null, next: null };
    const idx = navigableContentItems.findIndex((item) => item.type === currentType && item.id === currentId);
    if (idx < 0) return { prev: null, next: null };
    return {
      prev: navigableContentItems[idx - 1] ?? null,
      next: navigableContentItems[idx + 1] ?? null
    };
  });

  function goToContent(target: CourseContentItem | null) {
    if (!target) return;
    const courseIdResolved = courseApi.course?.id;
    if (!courseIdResolved) return;
    const path = getContentRoute(courseIdResolved, target);
    if (!path) return;
    goto(resolve(path, {}));
  }

  const isPrevDisabled = $derived(!prevNextContent.prev);
  const isNextDisabled = $derived(!prevNextContent.next);
  const isLessonComplete = $derived.by(() => {
    if (!lessonId) return false;
    const lesson = lessonItems.find((l) => l.id === lessonId);
    return lesson?.isComplete ?? false;
  });

  const showMarkComplete = $derived(!!lessonId && !exerciseId);

  const currentLessonItem = $derived(lessonId ? lessonItems.find((l) => l.id === lessonId) : null);
  const isTeacherLocked = $derived($isOrgStudent && currentLessonItem && !(currentLessonItem.isUnlocked ?? false));
  const isProgressionLocked = $derived($isOrgStudent && currentLessonItem?.accessible === false && !isTeacherLocked);
  const isVideoWatchLesson = $derived.by(() => {
    if (!lessonId) return false;

    return (
      lessonApi.lesson?.completionPolicy === 'video_watch' || currentLessonItem?.completionPolicy === 'video_watch'
    );
  });
  const watchedPercent = $derived.by(() => {
    const progress = lessonApi.lesson?.watchProgress;
    if (progress?.isComplete) return 100;

    if (typeof progress?.watchedPercent === 'number') {
      return progress.watchedPercent;
    }

    const durationSeconds = progress?.durationSeconds;
    if (durationSeconds && durationSeconds > 0) {
      return Math.min(100, ((progress?.watchedSeconds ?? 0) / durationSeconds) * 100);
    }

    return 0;
  });

  const watchedPercentDisplay = $derived(Math.round(watchedPercent));

  const watchVideosRequired = $derived(lessonApi.lesson?.watchProgress?.videosRequired ?? 0);
  const watchVideosComplete = $derived(lessonApi.lesson?.watchProgress?.videosComplete ?? 0);
  const isLessonLocked = $derived(isTeacherLocked || isProgressionLocked);
  const isVideoWatchComplete = $derived(isVideoWatchLesson && (lessonApi.lesson?.watchProgress?.isComplete ?? false));
  const showVideoWatchCompleteState = $derived(isVideoWatchComplete || (isVideoWatchLesson && isLessonComplete));
  const isMarkCompleteDisabled = $derived(
    isMarkingComplete || isLessonLocked || isLessonComplete || isVideoWatchLesson
  );
  const showWatchProgress = $derived(
    !!lessonId && $isOrgStudent && isVideoWatchLesson && !showVideoWatchCompleteState && !isLessonLocked
  );

  const watchProgressTooltip = $derived(
    watchVideosRequired > 1
      ? t.get('course.navItem.lessons.watch_progress.videos_complete', {
          complete: watchVideosComplete,
          required: watchVideosRequired,
          percent: watchedPercentDisplay
        })
      : t.get('course.navItem.lessons.watch_progress.status', { percent: watchedPercentDisplay })
  );

  async function markLessonComplete(currentLessonId: string) {
    isMarkingComplete = true;

    const lesson = lessonItems.find((entry) => entry.id === currentLessonId);
    const currentIsComplete = lesson?.isComplete ?? lessonApi.lesson?.isComplete ?? false;

    const isComplete = !currentIsComplete;

    await lessonApi.updateCompletion(courseId, currentLessonId, isComplete);

    if (lessonApi.success) {
      snackbar.success('snackbar.lessons.success.complete_marked');
      updateCourseContentCompletion(currentLessonId, isComplete);

      const allComplete =
        $isOrgStudent &&
        isComplete &&
        navigableContentItems.length > 0 &&
        navigableContentItems.every((item) => item.isComplete);

      if (allComplete) {
        const requiredExerciseId = courseApi.course?.certificate?.requiredExerciseId ?? undefined;
        openCourseCompletionModal(courseId);

        const certRes = await courseApi.getCertificationEvaluation(courseId);
        if (certRes?.data) {
          const hasCompletedCourse = Boolean(certRes.data.eligibleForCertificate || certRes.data.certificateEarnedAt);
          updateCourseCompletionModal(
            courseId,
            hasCompletedCourse ? 'eligible' : 'not-eligible',
            certRes.data,
            requiredExerciseId
          );
        } else {
          closeCourseCompletionModal();
        }
      }
    } else {
      snackbar.error('snackbar.lessons.error.try_later');
    }

    isMarkingComplete = false;
  }

  function updateCourseContentCompletion(currentLessonId: string, isComplete: boolean) {
    if (!courseApi.course?.content) return;

    courseApi.course = updateLessonCompletionInCourseContent(courseApi.course, currentLessonId, isComplete);
  }

  const INTERACTIVE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

  function handleKeydown(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    if (INTERACTIVE_TAGS.has(target.tagName) || target.isContentEditable) return;

    if (event.key === 'ArrowLeft' && !isPrevDisabled) {
      event.preventDefault();
      goToContent(prevNextContent.prev);
    } else if (event.key === 'ArrowRight' && !isNextDisabled) {
      event.preventDefault();
      goToContent(prevNextContent.next);
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="flex items-center gap-2">
  <Tooltip.Provider>
    {#if showWatchProgress}
      <Tooltip.Root>
        <Tooltip.Trigger>
          <span class="inline-flex shrink-0" aria-label={watchProgressTooltip}>
            <PercentRingProgress value={watchedPercent} size="small" />
          </span>
        </Tooltip.Trigger>
        <Tooltip.Content side="bottom" sideOffset={4}>
          {watchProgressTooltip}
        </Tooltip.Content>
      </Tooltip.Root>
    {:else if showMarkComplete && lessonId && !isLessonLocked && (showVideoWatchCompleteState || !isVideoWatchLesson)}
      <Button
        size="sm"
        variant="secondary"
        onclick={() => markLessonComplete(lessonId)}
        loading={isMarkingComplete}
        disabled={isMarkCompleteDisabled || showVideoWatchCompleteState}
      >
        <CircleCheckIcon size={14} filled={isLessonComplete || showVideoWatchCompleteState} />
        <span class="text-xs">{$t('course.navItem.lessons.mark_as')} {$t('course.navItem.lessons.complete')}</span>
      </Button>
    {/if}

    <div class="flex items-center gap-1">
      <Tooltip.Root>
        <Tooltip.Trigger>
          <Button
            size="icon-sm"
            variant="outline"
            onclick={() => goToContent(prevNextContent.prev)}
            disabled={isPrevDisabled}
            aria-label={$t('course.navItem.lessons.prev')}
          >
            <ChevronLeftIcon size={14} />
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Content side="bottom" sideOffset={4}>
          {$t('course.navItem.lessons.prev_shortcut')}
        </Tooltip.Content>
      </Tooltip.Root>

      <Tooltip.Root>
        <Tooltip.Trigger>
          <Button
            size="icon-sm"
            variant="outline"
            onclick={() => goToContent(prevNextContent.next)}
            disabled={isNextDisabled}
            aria-label={$t('course.navItem.lessons.next')}
          >
            <ChevronRightIcon size={14} />
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Content side="bottom" sideOffset={4}>
          {$t('course.navItem.lessons.next_shortcut')}
        </Tooltip.Content>
      </Tooltip.Root>
    </div>
  </Tooltip.Provider>
</div>
