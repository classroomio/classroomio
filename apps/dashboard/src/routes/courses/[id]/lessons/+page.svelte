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
  import { CourseContainer } from '$lib/components/CourseContainer';
  import { PageBody } from '$lib/components/Page';
  import { Button } from '@cio/ui/base/button';
  import { RoleBasedSecurity } from '$features/ui';
  import * as Page from '@cio/ui/base/page';
  import { t } from '$lib/utils/functions/translations';
  import { profile } from '$lib/utils/store/user';
  import type { Lesson } from '$lib/utils/types';
  import { COURSE_VERSION } from '$lib/utils/types';
  import { getGreeting } from '$lib/utils/functions/date.js';

  let { data } = $props();

  const query = new URLSearchParams(page.url.search);

  const lessonsLength = $derived($course.version === COURSE_VERSION.V1 ? $lessons.length : $lessonSections.length);

  let lessonEditing: string | undefined;
  let lessonToDelete: Lesson | undefined = $state();
  let openDeleteModal: boolean = $state(false);
  let isFetching: boolean = $state(false);
  let reorder = $state(false);
  let activateSections = $state(false);

  function addLesson() {
    $handleAddLessonWidget.open = true;

    $handleAddLessonWidget.isSection = $course.version === COURSE_VERSION.V2;
  }

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
        goto(`/courses/${data.courseId}/lessons/${incompleteLesson.id}`);
      } else {
        goto(`/courses/${data.courseId}/lessons`);
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

<CourseContainer
  onFetchingChange={(fetching) => {
    isFetching = fetching;
  }}
  courseId={data.courseId}
>
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>
        {$t(getGreeting())}
        {$profile.fullname}!
      </Page.Title>
    </Page.HeaderContent>
    <Page.Action>
      <div class="flex w-full justify-end gap-2">
        <RoleBasedSecurity allowedRoles={[1, 2]}>
          {#if $course.version === COURSE_VERSION.V1}
            <Button variant="outline" onclick={() => (activateSections = !activateSections)} disabled={!!lessonEditing}>
              {$t(`course.navItem.lessons.section_prompt.cta`)}
            </Button>
          {/if}
          <Button variant="outline" onclick={() => (reorder = !reorder)} disabled={!!lessonEditing}>
            {$t(`course.navItem.lessons.add_lesson.${reorder ? 'end_reorder' : 'start_reorder'}`)}
          </Button>
          <Button onclick={addLesson} disabled={!!lessonEditing}>
            {$t('course.navItem.lessons.add_lesson.button_title')}
          </Button>
        </RoleBasedSecurity>
      </div>
    </Page.Action>
  </Page.Header>

  <PageBody width="max-w-6xl" padding="p-0">
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
  </PageBody>
</CourseContainer>
