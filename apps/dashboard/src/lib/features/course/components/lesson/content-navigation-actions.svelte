<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import { CircleCheckIcon } from '$features/ui/icons';
  import { Button } from '@cio/ui/base/button';
  import { globalStore } from '$lib/utils/store/app';
  import { t } from '$lib/utils/functions/translations';
  import { courseApi, lessonApi } from '$features/course/api';
  import { getOrderedNavigableContent, getContentRoute } from '$features/course/utils/content';
  import { ContentType } from '@cio/utils/constants/content';
  import { snackbar } from '$features/ui/snackbar/store';
  import type { CourseContentItem } from '$features/course/utils/types';

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
  const isLessonLocked = $derived(
    $globalStore.isStudent && currentLessonItem && !(currentLessonItem.isUnlocked ?? false)
  );
  const isMarkCompleteDisabled = $derived(isMarkingComplete || isLessonLocked);

  async function markLessonComplete(currentLessonId: string) {
    isMarkingComplete = true;

    const lesson = lessonItems.find((entry) => entry.id === currentLessonId);
    const currentIsComplete = lesson?.isComplete ?? lessonApi.lesson?.isComplete ?? false;

    const isComplete = !currentIsComplete;

    await lessonApi.updateCompletion(courseId, currentLessonId, isComplete);

    if (lessonApi.success) {
      updateCourseContentCompletion(currentLessonId, isComplete);
      snackbar.success('snackbar.lessons.success.complete_marked');
    } else {
      snackbar.error('snackbar.lessons.error.try_later');
    }

    isMarkingComplete = false;
  }

  function updateCourseContentCompletion(currentLessonId: string, isComplete: boolean) {
    if (!courseApi.course?.content) return;

    if (courseApi.course.content.grouped) {
      courseApi.course = {
        ...courseApi.course,
        content: {
          ...courseApi.course.content,
          sections: courseApi.course.content.sections.map((section) => ({
            ...section,
            items: section.items.map((item) =>
              item.type === ContentType.Lesson && item.id === currentLessonId ? { ...item, isComplete } : item
            )
          }))
        }
      };
      return;
    }

    courseApi.course = {
      ...courseApi.course,
      content: {
        ...courseApi.course.content,
        items: courseApi.course.content.items.map((item) =>
          item.type === ContentType.Lesson && item.id === currentLessonId ? { ...item, isComplete } : item
        )
      }
    };
  }
</script>

<div class="flex items-center gap-2">
  {#if showMarkComplete && lessonId}
    <Button
      size="sm"
      variant="secondary"
      onclick={() => markLessonComplete(lessonId)}
      loading={isMarkingComplete}
      disabled={isMarkCompleteDisabled}
    >
      <CircleCheckIcon size={14} filled={isLessonComplete} />
      <span class="text-xs">{$t('course.navItem.lessons.mark_as')} {$t('course.navItem.lessons.complete')}</span>
    </Button>
  {/if}

  <div class="flex items-center gap-1">
    <Button
      size="icon-sm"
      variant="outline"
      onclick={() => goToContent(prevNextContent.prev)}
      disabled={isPrevDisabled}
      aria-label={$t('course.navItem.lessons.prev')}
      title={$t('course.navItem.lessons.prev')}
    >
      <ChevronLeftIcon size={14} />
    </Button>

    <Button
      size="icon-sm"
      variant="outline"
      onclick={() => goToContent(prevNextContent.next)}
      disabled={isNextDisabled}
      aria-label={$t('course.navItem.lessons.next')}
      title={$t('course.navItem.lessons.next')}
    >
      <ChevronRightIcon size={14} />
    </Button>
  </div>
</div>
