<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import { Button } from '@cio/ui/base/button';
  import { Progress } from '@cio/ui/base/progress';
  import { courseApi } from '$features/course/api';
  import { getContentRoute, getCourseProgress } from '$features/course/utils/content';
  import {
    getNextIncompleteNavigableContent,
    getPreviousNavigableContent
  } from '$features/course/utils/content-navigation';
  import { getStudentContentLockReason } from '$features/ai-assistant/utils/content-ask-ai-bar';
  import { getStudentContentLockTitleKey } from '$features/course/utils/content-lock-utils';
  import { ContentType } from '@cio/utils/constants/content';
  import { t } from '$lib/utils/functions/translations';
  import { isCourseLearnerView } from '$lib/utils/store/app';
  import { snackbar } from '$features/ui/snackbar/store';
  import type { CourseContentItem } from '$features/course/utils/types';

  interface Props {
    courseId: string;
    path: string;
    class?: string;
  }

  let { courseId, path, class: className = '' }: Props = $props();

  const courseProgress = $derived(getCourseProgress(courseApi.course));
  const previousItem = $derived(getPreviousNavigableContent(courseApi.course, path));
  const nextItem = $derived(getNextIncompleteNavigableContent(courseApi.course, path));

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

<div class={className}>
  <nav class="flex gap-2 px-3 py-2.5" aria-label={$t('course.sidebar.footer_nav.label')}>
    <Button
      size="sm"
      variant="outline"
      class="flex-1"
      onclick={() => goToContent(previousItem)}
      disabled={isPreviousDisabled}
      title={previousLockReason ? $t(getStudentContentLockTitleKey(previousLockReason)) : undefined}
    >
      <ChevronLeftIcon size={16} />
      {$t('course.sidebar.footer_nav.previous')}
    </Button>

    <Button
      size="sm"
      variant="default"
      class="flex-1"
      onclick={() => goToContent(nextItem)}
      disabled={isNextDisabled}
      title={nextLockReason ? $t(getStudentContentLockTitleKey(nextLockReason)) : undefined}
    >
      {$t('course.sidebar.footer_nav.next')}
      <ChevronRightIcon size={16} />
    </Button>
  </nav>

  <p class="ui:text-muted-foreground truncate px-3 pb-2 text-[11px]">
    {$t('course.sidebar.progress.lessons', {
      completed: courseProgress.lessonsComplete,
      total: courseProgress.lessonsTotal
    })}{#if courseProgress.exercisesTotal > 0}
      · {$t('course.sidebar.progress.exercises', {
        completed: courseProgress.exercisesComplete,
        total: courseProgress.exercisesTotal
      })}{/if}
  </p>

  <Progress value={courseProgress.percent} max={100} class="ui:h-[3px] ui:rounded-none" aria-hidden="true" />
</div>
