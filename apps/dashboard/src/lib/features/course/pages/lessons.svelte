<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { Empty } from '@cio/ui/custom/empty';
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import DeleteLessonConfirmation from '$features/course/components/lesson/delete-lesson-confirmation.svelte';
  import LessonList from '$features/course/components/lesson/lesson-list.svelte';
  import LessonSectionList from '$features/course/components/lesson/lesson-section-list.svelte';
  import { lessonApi } from '$features/course/api';
  import { courseApi } from '$features/course/api';
  import { t } from '$lib/utils/functions/translations';
  import type { CourseContentItem } from '$features/course/utils/types';
  import { getCourseContent } from '$features/course/utils/content';
  import { ContentType } from '@cio/utils/constants/content';
  import { profile } from '$lib/utils/store/user';

  interface Props {
    courseId: string;
    reorder?: boolean;
  }

  let { courseId, reorder = $bindable(false) }: Props = $props();

  const query = new URLSearchParams(page.url.search);

  const contentData = $derived(getCourseContent(courseApi.course));
  const contentLength = $derived(contentData.grouped ? contentData.sections.length : contentData.items.length);
  const contentItems = $derived(
    contentData.grouped ? contentData.sections.flatMap((section) => section.items) : contentData.items
  );
  const lessonItems = $derived(contentItems.filter((item) => item.type === ContentType.Lesson));

  let lessonEditing: string | undefined;
  let lessonToDelete: CourseContentItem | undefined = $state();
  let openDeleteModal: boolean = $state(false);
  let isFetching: boolean = $state(false);
  const profileId = $derived($profile?.id || '');

  function findFirstIncompleteLesson() {
    return lessonItems.find((lesson) => !lesson.isComplete && lesson.isUnlocked === true);
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
    !isFetching && shouldGoToNextLesson && onNextQuery(lessonItems);
  });
</script>

<DeleteLessonConfirmation
  bind:openDeleteModal
  deleteLesson={async () => {
    if (!lessonToDelete?.id) return;
    const courseId = courseApi.course?.id;
    if (!courseId) return;

    await lessonApi.delete(courseId, lessonToDelete.id);

    if (lessonApi.success && profileId) {
      await courseApi.refreshCourse(courseId, profileId);
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
{:else if contentLength > 0}
  {#if reorder}
    <p class="text-center text-xs text-gray-400 italic dark:text-white">
      {$t('course.navItem.lessons.drag')}
    </p>
  {/if}

  {#if contentData.grouped}
    <LessonSectionList {reorder} {lessonEditing} />
  {:else}
    <LessonList {reorder} {lessonEditing} bind:lessonToDelete bind:openDeleteModal />
  {/if}
{:else}
  <Empty
    title={$t('course.navItem.lessons.body_header')}
    description={$t('course.navItem.lessons.body_content')}
    icon={BookOpenIcon}
    variant="page"
  />
{/if}
