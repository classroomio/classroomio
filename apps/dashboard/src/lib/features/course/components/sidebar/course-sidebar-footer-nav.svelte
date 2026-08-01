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
    getActiveNavigableContent,
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
  const activeItem = $derived(getActiveNavigableContent(courseApi.course, path));
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
  <nav class="flex items-center gap-2 px-3 py-2.5" aria-label={$t('course.sidebar.footer_nav.label')}>
    <Button
      size="icon-sm"
      variant="outline"
      onclick={() => goToContent(previousItem)}
      disabled={isPreviousDisabled}
      aria-label={$t('course.sidebar.footer_nav.previous')}
      title={previousLockReason ? $t(getStudentContentLockTitleKey(previousLockReason)) : undefined}
    >
      <ChevronLeftIcon size={16} />
    </Button>

    <p class="min-w-0 flex-1 truncate text-center text-[13px] font-semibold">
      {activeItem?.title ?? ''}
    </p>

    <Button
      size="icon-sm"
      variant="default"
      onclick={() => goToContent(nextItem)}
      disabled={isNextDisabled}
      aria-label={$t('course.sidebar.footer_nav.next')}
      title={nextLockReason ? $t(getStudentContentLockTitleKey(nextLockReason)) : undefined}
    >
      <ChevronRightIcon size={16} />
    </Button>
  </nav>

  <Progress value={courseProgress.percent} max={100} class="ui:h-[3px] ui:rounded-none" aria-hidden="true" />
</div>
