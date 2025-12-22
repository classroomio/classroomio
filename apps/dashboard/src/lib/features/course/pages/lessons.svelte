<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import ActivateSectionsModal from '$lib/components/Course/components/Lesson/ActivateSectionsModal.svelte';
  import { Empty } from '@cio/ui/custom/empty';
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import DeleteLessonConfirmation from '$lib/components/Course/components/Lesson/DeleteLessonConfirmation.svelte';
  import LessonList from '$lib/components/Course/components/Lesson/LessonList.svelte';
  import LessonSectionList from '$lib/components/Course/components/Lesson/LessonSectionList.svelte';
  import NewLessonModal from '$lib/components/Course/components/Lesson/NewLessonModal.svelte';
  import { handleAddLessonWidget } from '$lib/components/Course/components/Lesson/store';
  import { handleDelete, lessons, lessonSections } from '$lib/components/Course/components/Lesson/store/lessons';
  import { course } from '$lib/components/Course/store';
  import { RoleBasedSecurity } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';
  import { profile } from '$lib/utils/store/user';
  import type { Lesson } from '$lib/utils/types';
  import { COURSE_VERSION } from '$lib/utils/types';

  interface Props {
    courseId: string;
  }

  let { courseId }: Props = $props();

  const query = new URLSearchParams(page.url.search);

  const lessonsLength = $derived($course.version === COURSE_VERSION.V1 ? $lessons.length : $lessonSections.length);

  let lessonEditing: string | undefined;
  let lessonToDelete: Lesson | undefined = $state();
  let openDeleteModal: boolean = $state(false);
  let isFetching: boolean = $state(false);
  let reorder = $state(false);
  let activateSections = $state(false);

  function hasUserCompletedLesson(completion) {
    return completion?.find((c) => c.profile_id === $profile.id);
  }

  const getLessons = () => {
    if ($course.version === COURSE_VERSION.V1) {
      return $lessons;
    } else {
      const _lessons: Lesson[] = [];

      $lessonSections.forEach((section) => {
        _lessons.push(...section.lessons);
      });

      return _lessons;
    }
  };

  function findFirstIncompleteLesson() {
    return getLessons().find(
      (lesson) => !hasUserCompletedLesson(lesson.lesson_completion) && lesson.is_unlocked === true
    );
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
    !isFetching && shouldGoToNextLesson && onNextQuery($lessons);
  });
</script>

<NewLessonModal />

<ActivateSectionsModal bind:open={activateSections} />

<DeleteLessonConfirmation bind:openDeleteModal deleteLesson={() => handleDelete(lessonToDelete?.id)} />

{#if shouldGoToNextLesson}
  <Empty
    title={$t('course.navItem.lessons.no_lesson')}
    description={$t('course.navItem.lessons.share_your_knowledge')}
    icon={BookOpenIcon}
    variant="page"
  />
{:else if lessonsLength > 0}
  {#if reorder}
    <p class="text-center text-xs italic text-gray-400 dark:text-white">
      {$t('course.navItem.lessons.drag')}
    </p>
  {/if}

  {#if $course.version === COURSE_VERSION.V1}
    <LessonList {reorder} {lessonEditing} bind:lessonToDelete bind:openDeleteModal />
  {:else if $course.version === COURSE_VERSION.V2}
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

