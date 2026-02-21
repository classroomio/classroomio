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
  import { getCourseContent } from '$features/course/utils/content';
  import { ContentType } from '@cio/utils/constants/content';
  import { snackbar } from '$features/ui/snackbar/store';

  interface Props {
    lessonId: string;
    courseId: string;
  }

  let { lessonId, courseId }: Props = $props();

  let isMarkingComplete = $state(false);

  const contentData = $derived(getCourseContent(courseApi.course));
  const contentItems = $derived(
    contentData.grouped ? contentData.sections.flatMap((section) => section.items) : contentData.items
  );
  const lessonItems = $derived(contentItems.filter((item) => item.type === ContentType.Lesson));

  const isNextOrPrevDisabled = (currentLessonId: string, isPrev: boolean) => {
    const index = lessonItems.findIndex((lesson) => lesson.id === currentLessonId);

    return isPrev ? !lessonItems[index - 1] : !lessonItems[index + 1];
  };

  const goToNextOrPrevLesson = (currentLessonId: string, isPrev: boolean) => {
    const isDisabled = isNextOrPrevDisabled(currentLessonId, isPrev);

    if (isDisabled) return;

    const index = lessonItems.findIndex((lesson) => lesson.id === currentLessonId);
    const nextOrPrevLesson = isPrev ? lessonItems[index - 1] : lessonItems[index + 1];

    const isLocked = $globalStore.isStudent && !nextOrPrevLesson.isUnlocked;

    if (isLocked) return;

    const path = `/courses/${courseApi.course?.id}/lessons/${nextOrPrevLesson.id}`;
    goto(resolve(path, {}));
  };

  const isPrevDisabled = $derived(isNextOrPrevDisabled(lessonId, true));
  const isNextDisabled = $derived(isNextOrPrevDisabled(lessonId, false));
  const isLessonComplete = $derived.by(() => {
    const lesson = lessonItems.find((lesson) => lesson.id === lessonId);
    return lesson?.isComplete ?? false;
  });

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
  <Button
    size="sm"
    variant="secondary"
    onclick={() => markLessonComplete(lessonId)}
    loading={isMarkingComplete}
    disabled={isMarkingComplete}
  >
    <CircleCheckIcon size={14} filled={isLessonComplete} />
    <span class="text-xs">{$t('course.navItem.lessons.mark_as')} {$t('course.navItem.lessons.complete')}</span>
  </Button>

  <div class="flex items-center gap-1">
    <Button
      size="icon-sm"
      variant="outline"
      onclick={() => goToNextOrPrevLesson(lessonId, true)}
      disabled={isPrevDisabled}
      aria-label={$t('course.navItem.lessons.prev')}
      title={$t('course.navItem.lessons.prev')}
    >
      <ChevronLeftIcon size={14} />
    </Button>

    <Button
      size="icon-sm"
      variant="outline"
      onclick={() => goToNextOrPrevLesson(lessonId, false)}
      disabled={isNextDisabled}
      aria-label={$t('course.navItem.lessons.next')}
      title={$t('course.navItem.lessons.next')}
    >
      <ChevronRightIcon size={14} />
    </Button>
  </div>
</div>
