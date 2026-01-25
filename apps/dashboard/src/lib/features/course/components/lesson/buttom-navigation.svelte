<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { globalStore } from '$lib/utils/store/app';
  import { t } from '$lib/utils/functions/translations';
  import { courseApi, lessonApi } from '$features/course/api';
  import { getCourseContent } from '$features/course/utils/content';
  import { ContentType } from '@cio/utils/constants/content';
  import { snackbar } from '$features/ui/snackbar/store';
  import { CircleCheckIcon } from '$features/ui/icons';
  import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

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

  const isNextOrPrevDisabled = (lessonId: string, isPrev: boolean) => {
    const index = lessonItems.findIndex((lesson) => lesson.id === lessonId);

    return isPrev ? !lessonItems[index - 1] : !lessonItems[index + 1];
  };

  const goToNextOrPrevLesson = (lessonId: string, isPrev: boolean) => {
    const isDisabled = isNextOrPrevDisabled(lessonId, isPrev);

    if (isDisabled) return;

    const index = lessonItems.findIndex((lesson) => lesson.id === lessonId);
    const nextOrPrevLesson = isPrev ? lessonItems[index - 1] : lessonItems[index + 1];

    const isLocked = $globalStore.isStudent && !nextOrPrevLesson.isUnlocked;

    if (isLocked) return;

    const path = `/courses/${courseApi.course?.id}/lessons/${nextOrPrevLesson.id}`;
    goto(resolve(path, {}));
  };

  const isPrevDisabled = $derived(isNextOrPrevDisabled(lessonId, true));
  const isNextDisabled = $derived(isNextOrPrevDisabled(lessonId, false));
  const isLessonComplete = $derived.by(() => {
    const lesson = lessonItems.find((l) => l.id === lessonId);
    return lesson?.isComplete ?? false;
  });

  async function markLessonComplete(lessonId: string) {
    isMarkingComplete = true;

    const lesson = lessonItems.find((l) => l.id === lessonId);
    const currentIsComplete = lesson?.isComplete ?? lessonApi.lesson?.isComplete ?? false;

    const isComplete = !currentIsComplete;

    await lessonApi.updateCompletion(courseId, lessonId, isComplete);

    if (lessonApi.success) {
      updateCourseContentCompletion(lessonId, isComplete);
      snackbar.success('snackbar.lessons.success.complete_marked');
    } else {
      snackbar.error('snackbar.lessons.error.try_later');
    }

    isMarkingComplete = false;
  }

  function updateCourseContentCompletion(lessonId: string, isComplete: boolean) {
    if (!courseApi.course?.content) return;

    if (courseApi.course.content.grouped) {
      courseApi.course = {
        ...courseApi.course,
        content: {
          ...courseApi.course.content,
          sections: courseApi.course.content.sections.map((section) => ({
            ...section,
            items: section.items.map((item) =>
              item.type === ContentType.Lesson && item.id === lessonId ? { ...item, isComplete } : item
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
          item.type === ContentType.Lesson && item.id === lessonId ? { ...item, isComplete } : item
        )
      }
    };
  }
</script>

<div class="absolute bottom-5 flex w-full items-center justify-center">
  <div class="flex w-fit items-center gap-2 rounded-full bg-gray-100 px-5 py-1 shadow-xl dark:bg-neutral-700">
    <button
      disabled={isPrevDisabled}
      class={`my-2 flex items-center border border-t-0 border-b-0 border-l-0 border-gray-300 px-2 pr-4 ${
        isPrevDisabled && 'cursor-not-allowed opacity-25'
      }`}
      onclick={() => goToNextOrPrevLesson(lessonId, true)}
    >
      <ChevronLeftIcon size={16} />
      <span class="hidden md:block">{$t('course.navItem.lessons.prev')}</span>
    </button>
    <button
      class="my-2 flex items-center border border-t-0 border-b-0 border-l-0 border-gray-300 px-2 pr-4"
      onclick={() => markLessonComplete(lessonId)}
      disabled={isMarkingComplete}
    >
      <CircleCheckIcon filled={isLessonComplete} />
    </button>
    <button
      disabled={isNextDisabled}
      class={`my-2 flex items-center px-2 ${isNextDisabled && 'cursor-not-allowed opacity-25'}`}
      onclick={() => goToNextOrPrevLesson(lessonId, false)}
    >
      <span class="hidden md:block">{$t('course.navItem.lessons.next')}</span>
      <ChevronRightIcon size={16} />
    </button>
  </div>
</div>
