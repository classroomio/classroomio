<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { PublicCourseBottomNav } from '@cio/ui/custom/public-course';
  import { Button } from '@cio/ui/base/button';
  import { courseApi, lessonApi } from '$features/course/api';
  import { getContentRoute, getCourseProgress } from '$features/course/utils/content';
  import {
    getActiveNavigableContent,
    getNextIncompleteNavigableContent,
    getPreviousNavigableContent,
    resolveActiveNavigableContentIndex
  } from '$features/course/utils/content-navigation';
  import { getStudentContentLockReason } from '$features/ai-assistant/utils/content-ask-ai-bar';
  import { getStudentContentLockTitleKey } from '$features/course/utils/content-lock-utils';
  import { toggleLessonCompletion } from '$features/course/utils/toggle-lesson-completion';
  import {
    getLessonCompletionState,
    getLessonCompletionToggleLabel
  } from '$features/course/utils/lesson-completion-state';
  import { ContentType } from '@cio/utils/constants/content';
  import { CircleCheckIcon } from '$features/ui/icons';
  import { t } from '$lib/utils/functions/translations';
  import { isCourseLearnerView } from '$lib/utils/store/app';
  import { snackbar } from '$features/ui/snackbar/store';
  import type { CourseContentItem } from '$features/course/utils/types';
  import CourseMobileOutlineSheet from './course-mobile-outline-sheet.svelte';

  interface Props {
    courseId: string;
    path: string;
  }

  let { courseId, path }: Props = $props();

  let sheetOpen = $state(false);
  let isMarkingComplete = $state(false);

  const currentPath = $derived(path || page.url.pathname);
  const courseProgress = $derived(getCourseProgress(courseApi.course));
  const activeIndex = $derived(resolveActiveNavigableContentIndex(courseApi.course, currentPath));
  const activeItem = $derived(getActiveNavigableContent(courseApi.course, currentPath));
  const previousItem = $derived(getPreviousNavigableContent(courseApi.course, currentPath));
  const nextItem = $derived(getNextIncompleteNavigableContent(courseApi.course, currentPath));

  const positionLabel = $derived(
    activeIndex >= 0 && courseProgress.total > 0 ? `${activeIndex + 1} / ${courseProgress.total}` : ''
  );

  const contentLockReason = $derived(
    activeItem?.type === ContentType.Lesson
      ? getStudentContentLockReason(courseApi.course, activeItem.id, ContentType.Lesson)
      : null
  );
  const completionState = $derived(
    getLessonCompletionState({
      contentItem: activeItem,
      isLearnerView: $isCourseLearnerView,
      lockReason: contentLockReason,
      loadedLesson: lessonApi.lesson
    })
  );
  const showCompleteToggle = $derived(completionState.canToggleCompletion);
  const isLessonComplete = $derived(completionState.isLessonComplete);
  const completeToggleLabel = $derived(getLessonCompletionToggleLabel(isLessonComplete));

  function getNavigableLockReason(target: CourseContentItem | null) {
    if (!target) {
      return null;
    }

    const targetType = target.type === ContentType.Lesson ? ContentType.Lesson : ContentType.Exercise;
    return getStudentContentLockReason(courseApi.course, target.id, targetType);
  }

  function goToContent(target: CourseContentItem | null) {
    if (!target) {
      return;
    }

    const lockReason = getNavigableLockReason(target);
    if ($isCourseLearnerView && lockReason) {
      snackbar.error(getStudentContentLockTitleKey(lockReason));
      return;
    }

    const route = getContentRoute(courseId, target);
    if (!route) {
      return;
    }

    goto(resolve(route, {}));
  }

  async function handleToggleComplete() {
    if (!activeItem || activeItem.type !== ContentType.Lesson || isMarkingComplete) {
      return;
    }

    isMarkingComplete = true;
    await toggleLessonCompletion(courseId, activeItem.id);
    isMarkingComplete = false;
  }

  const previousLockReason = $derived($isCourseLearnerView ? getNavigableLockReason(previousItem) : null);
  const nextLockReason = $derived($isCourseLearnerView ? getNavigableLockReason(nextItem) : null);
  const isPreviousDisabled = $derived(!previousItem || Boolean(previousLockReason));
  const isNextDisabled = $derived(!nextItem || Boolean(nextLockReason));
</script>

<PublicCourseBottomNav
  {positionLabel}
  sublineLabel={activeItem?.title}
  sublineComplete={showCompleteToggle ? false : (activeItem?.isComplete ?? false)}
  hasPrev={!isPreviousDisabled}
  hasNext={!isNextDisabled}
  onPrev={() => goToContent(previousItem)}
  onNext={() => goToContent(nextItem)}
  onOpenSheet={() => (sheetOpen = true)}
  openSheetLabel={$t('course.navItems.nav_content')}
  prevLabel={$t('course.sidebar.footer_nav.previous')}
  nextLabel={$t('course.sidebar.footer_nav.next')}
  centerVariant="ring"
  progressPercent={courseProgress.percent}
>
  {#snippet completeToggle()}
    {#if showCompleteToggle}
      <Button
        type="button"
        variant="secondary"
        size="icon-sm"
        class={isLessonComplete ? 'ui:text-primary' : ''}
        disabled={isMarkingComplete}
        aria-pressed={isLessonComplete}
        aria-label={completeToggleLabel}
        onclick={() => handleToggleComplete()}
      >
        <CircleCheckIcon size={18} filled={isLessonComplete} />
      </Button>
    {/if}
  {/snippet}
</PublicCourseBottomNav>

<CourseMobileOutlineSheet bind:open={sheetOpen} path={currentPath} {courseId} />
