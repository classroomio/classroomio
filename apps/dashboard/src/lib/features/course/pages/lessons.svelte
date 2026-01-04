<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import ActivateSectionsModal from '$features/course/components/lesson/activate-sections-modal.svelte';
  import { Empty } from '@cio/ui/custom/empty';
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import DeleteLessonConfirmation from '$features/course/components/lesson/delete-lesson-confirmation.svelte';
  import LessonList from '$features/course/components/lesson/lesson-list.svelte';
  import LessonSectionList from '$features/course/components/lesson/lesson-section-list.svelte';
  import NewLessonModal from '$features/course/components/lesson/new-lesson-modal.svelte';
  import { lessonApi } from '$features/course/api';
  import { courseApi } from '$features/course/api';
  import { t } from '$lib/utils/functions/translations';
  import type { ListLessons } from '$features/course/utils/types';

  interface Props {
    courseId: string;
  }

  let { courseId }: Props = $props();

  const query = new URLSearchParams(page.url.search);

  const lessonsLength = $derived(
    courseApi.course?.version === 'V1' ? lessonApi.lessons.length : lessonApi.sections.length
  );

  let lessonEditing: string | undefined;
  let lessonToDelete: ListLessons[number] | undefined = $state();
  let openDeleteModal: boolean = $state(false);
  let isFetching: boolean = $state(false);
  let reorder = $state(false);
  let activateSections = $state(false);

  const getLessons = () => {
    if (courseApi.course?.version === 'V1') {
      return lessonApi.lessons;
    } else {
      const _lessons: ListLessons[number][] = [];

      lessonApi.sections.forEach((section) => {
        _lessons.push(...section.lessons);
      });

      return _lessons;
    }
  };

  function findFirstIncompleteLesson() {
    return getLessons().find((lesson) => !lesson.isComplete && lesson.isUnlocked === true);
  }

  function onNextQuery(lessons) {
    if (!isFetching && lessons.length > 0) {
      const incompleteLesson = findFirstIncompleteLesson();

      if (incompleteLesson) {
        goto(`/courses/${courseId}/lessons/${incompleteLesson.id}`);
      } else {
        goto(`/courses/${courseId}/lessons`);
      }
    }
  }

  let shouldGoToNextLesson = $derived(query.get('next') === 'true');
  $effect(() => {
    !isFetching && shouldGoToNextLesson && onNextQuery(lessonApi.lessons);
  });
</script>

<NewLessonModal />

<ActivateSectionsModal bind:open={activateSections} />

<DeleteLessonConfirmation
  bind:openDeleteModal
  deleteLesson={async () => {
    if (!lessonToDelete?.id) return;
    const courseId = courseApi.course?.id;
    if (!courseId) return;

    await lessonApi.delete(courseId, lessonToDelete.id);

    if (lessonApi.success) {
      lessonApi.lessons = lessonApi.lessons.filter((lesson) => lesson.id !== lessonToDelete?.id);
      lessonApi.sections = lessonApi.sections.map((section) => {
        section.lessons = section.lessons.filter((lesson) => lesson.id !== lessonToDelete?.id);
        return section;
      });
    }
  }}
/>

{#if shouldGoToNextLesson}
  <Empty
    title={$t('course.navItem.lessons.no_lesson')}
    description={$t('course.navItem.lessons.share_your_knowledge')}
    icon={BookOpenIcon}
    variant="page"
  />
{:else if lessonsLength > 0}
  {#if reorder}
    <p class="text-center text-xs text-gray-400 italic dark:text-white">
      {$t('course.navItem.lessons.drag')}
    </p>
  {/if}

  {#if courseApi.course?.version === 'V1'}
    <LessonList {reorder} {lessonEditing} bind:lessonToDelete bind:openDeleteModal />
  {:else if courseApi.course?.version === 'V2'}
    <LessonSectionList {reorder} {lessonEditing} />
  {/if}
{:else}
  <Empty
    title={$t('course.navItem.lessons.body_header')}
    description={$t('course.navItem.lessons.body_content')}
    icon={BookOpenIcon}
    variant="page"
  />
{/if}
