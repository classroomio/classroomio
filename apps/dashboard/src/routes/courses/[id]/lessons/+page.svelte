<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import Box from '$lib/components/Box/index.svelte';
  import ActivateSectionsModal from '$lib/components/Course/components/Lesson/ActivateSectionsModal.svelte';
  import DeleteLessonConfirmation from '$lib/components/Course/components/Lesson/DeleteLessonConfirmation.svelte';
  import LessonList from '$lib/components/Course/components/Lesson/LessonList.svelte';
  import LessonSectionList from '$lib/components/Course/components/Lesson/LessonSectionList.svelte';
  import NewLessonModal from '$lib/components/Course/components/Lesson/NewLessonModal.svelte';
  import { handleAddLessonWidget } from '$lib/components/Course/components/Lesson/store';
  import { handleDelete, lessons, lessonSections } from '$lib/components/Course/components/Lesson/store/lessons';
  import { course } from '$lib/components/Course/store';
  import { CourseContainer } from '$lib/components/CourseContainer';
  import { PageBody, PageNav } from '$lib/components/Page';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { RoleBasedSecurity } from '$lib/features/ui';
  import { t } from '$lib/utils/functions/translations';
  import { profile } from '$lib/utils/store/user';
  import type { Lesson } from '$lib/utils/types';
  import { COURSE_VERSION } from '$lib/utils/types';

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
  <PageNav title={$t('course.navItem.lessons.heading_v2')}>
    {#snippet widget()}
      <div class="flex w-full justify-end gap-2">
        <RoleBasedSecurity allowedRoles={[1, 2]}>
          {#if $course.version === COURSE_VERSION.V1}
            <PrimaryButton
              label={$t(`course.navItem.lessons.section_prompt.cta`)}
              variant={VARIANTS.OUTLINED}
              onClick={() => (activateSections = !activateSections)}
              isDisabled={!!lessonEditing}
            />
          {/if}
          <PrimaryButton
            label={$t(`course.navItem.lessons.add_lesson.${reorder ? 'end_reorder' : 'start_reorder'}`)}
            variant={VARIANTS.OUTLINED}
            onClick={() => (reorder = !reorder)}
            isDisabled={!!lessonEditing}
          />
          <PrimaryButton
            label={$t('course.navItem.lessons.add_lesson.button_title')}
            onClick={addLesson}
            isDisabled={!!lessonEditing}
          />
        </RoleBasedSecurity>
      </div>
    {/snippet}
  </PageNav>

  <PageBody width="max-w-6xl" padding="p-0">
    {#if shouldGoToNextLesson}
      <Box className="w-full lg:w-11/12 lg:px-4 m-auto">
        <div class="flex flex-col items-center justify-between">
          <img src="/images/empty-lesson-icon.svg" alt="Lesson" class="mx-auto my-2.5" />
          <h2 class="my-1.5 text-xl font-normal">{$t('course.navItem.lessons.no_lesson')}</h2>
          <p class="text-center text-sm text-slate-500">
            {$t('course.navItem.lessons.share_your_knowledge')}
          </p>
        </div>
      </Box>
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
      <Box className="w-full lg:w-11/12 lg:px-4 m-auto">
        <div class="flex flex-col items-center justify-between">
          <img src="/images/empty-lesson-icon.svg" alt="Lesson" class="mx-auto my-2.5" />
          <h2 class="my-1.5 text-xl font-normal">{$t('course.navItem.lessons.body_header')}</h2>
          <p class="text-center text-sm text-slate-500">
            {$t('course.navItem.lessons.body_content')}
          </p>
        </div>
      </Box>
    {/if}
  </PageBody>
</CourseContainer>
