<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { PublicCourseBottomNav } from '@cio/ui/custom/public-course';
  import { courseApi } from '$features/course/api';
  import { getContentRoute, getCourseProgress } from '$features/course/utils/content';
  import {
    getActiveNavigableContent,
    getNextIncompleteNavigableContent,
    getPreviousNavigableContent,
    resolveActiveNavigableContentIndex
  } from '$features/course/utils/content-navigation';
  import { getStudentContentLockReason } from '$features/ai-assistant/utils/content-ask-ai-bar';
  import { getStudentContentLockTitleKey } from '$features/course/utils/content-lock-utils';
  import { ContentType } from '@cio/utils/constants/content';
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

  const currentPath = $derived(path || page.url.pathname);
  const courseProgress = $derived(getCourseProgress(courseApi.course));
  const activeIndex = $derived(resolveActiveNavigableContentIndex(courseApi.course, currentPath));
  const activeItem = $derived(getActiveNavigableContent(courseApi.course, currentPath));
  const previousItem = $derived(getPreviousNavigableContent(courseApi.course, currentPath));
  const nextItem = $derived(getNextIncompleteNavigableContent(courseApi.course, currentPath));

  const positionLabel = $derived(
    activeIndex >= 0 && courseProgress.total > 0 ? `${activeIndex + 1} / ${courseProgress.total}` : ''
  );

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

  const previousLockReason = $derived($isCourseLearnerView ? getNavigableLockReason(previousItem) : null);
  const nextLockReason = $derived($isCourseLearnerView ? getNavigableLockReason(nextItem) : null);
  const isPreviousDisabled = $derived(!previousItem || Boolean(previousLockReason));
  const isNextDisabled = $derived(!nextItem || Boolean(nextLockReason));
</script>

<PublicCourseBottomNav
  {positionLabel}
  sublineLabel={activeItem?.title}
  sublineComplete={activeItem?.isComplete ?? false}
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
/>

<CourseMobileOutlineSheet bind:open={sheetOpen} path={currentPath} {courseId} />
