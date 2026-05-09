<script lang="ts">
  import { goto } from '$app/navigation';
  import { PublicCourse } from '@cio/ui';
  import {
    toPublicExerciseView,
    toPublicLessonView,
    toPublicSidebarSections
  } from '$features/course/utils/public-course-mappers';
  import {
    publicExerciseAttemptsStorageKey,
    type PublicCourseSidebarItem,
    type PublicCourseSidebarSection,
    type PublicLessonViewData,
    type PublicExerciseViewData
  } from '@cio/ui/custom/public-course';
  import { getExerciseQuestionLabels } from '$features/course/components/exercise/question-labels';
  import { t } from '$lib/utils/functions/translations';

  const exerciseLabels = $derived(getExerciseQuestionLabels());

  let { data } = $props();

  const sections: PublicCourseSidebarSection[] = $derived(toPublicSidebarSections(data.tree));
  const flatItems = $derived(sections.flatMap((section) => section.items));

  const itemSlug = $derived(data.item.slug);
  const activeIndex = $derived(flatItems.findIndex((entry) => entry.slug === itemSlug));
  const activeItem = $derived<PublicCourseSidebarItem | null>(flatItems[activeIndex] ?? null);
  const prevItem = $derived(activeIndex > 0 ? flatItems[activeIndex - 1] : null);
  const nextItem = $derived(activeIndex >= 0 && activeIndex < flatItems.length - 1 ? flatItems[activeIndex + 1] : null);

  const callout = $derived(data.tree.course.callout ?? null);
  const courseTitle = $derived(data.tree.course.title);
  const org = $derived(data.tree.course.org ?? null);

  const hrefFor = (item: PublicCourseSidebarItem) => `/course/${data.tree.course.slug}/lesson/${item.slug}`;

  async function navigateTo(item: PublicCourseSidebarItem | null) {
    if (!item) return;

    await goto(hrefFor(item));
  }

  const lessonView = $derived<PublicLessonViewData | null>(
    data.item.kind === 'lesson' ? toPublicLessonView(data.item) : null
  );
  const exerciseView = $derived<PublicExerciseViewData | null>(
    data.item.kind === 'exercise' ? toPublicExerciseView(data.item) : null
  );
</script>

<PublicCourse.PublicCourseShell
  {sections}
  {courseTitle}
  {org}
  activeSlug={itemSlug}
  {activeItem}
  activeFlatIndex={activeIndex >= 0 ? activeIndex : null}
  totalItems={flatItems.length}
  hasPrev={!!prevItem}
  hasNext={!!nextItem}
  {prevItem}
  {nextItem}
  {hrefFor}
  exploreHref="/courses"
  signInHref="/login"
  exploreLabel={$t('public_course.header.explore_courses')}
  signInLabel={$t('public_course.header.sign_in')}
  footerPrevLabel={$t('public_course.footer_nav.previous')}
  footerNextLabel={$t('public_course.footer_nav.next')}
  courseSlug={data.tree.course.slug}
  poweredByLabel={$t('public_course.powered_by.label')}
  poweredByBrand={$t('public_course.powered_by.brand')}
  onItemClick={navigateTo}
  onPrev={() => navigateTo(prevItem)}
  onNext={() => navigateTo(nextItem)}
>
  {#if lessonView}
    <PublicCourse.PublicLessonView lesson={lessonView} {callout} />
  {:else if exerciseView}
    {#key itemSlug}
      <PublicCourse.PublicExerciseView
        exercise={exerciseView}
        {callout}
        labels={exerciseLabels}
        attemptsPersistenceKey={publicExerciseAttemptsStorageKey(data.tree.course.slug, itemSlug)}
        formatAttemptOption={({ attemptNumber, correct, total }) =>
          t.get('public_course.exercise.attempt_option', { attemptNumber, correct, total })}
        newAttemptOptionLabel={$t('public_course.exercise.practice_again')}
        attemptsSelectAriaLabel={$t('public_course.exercise.attempts_select_aria')}
        submitLabel={$t('public_course.exercise.submit')}
        tryAgainLabel={$t('public_course.exercise.try_again')}
        privacyHint={$t('public_course.exercise.privacy_hint')}
        summaryTemplate={$t('public_course.exercise.summary_template')}
      />
    {/key}
  {/if}
</PublicCourse.PublicCourseShell>
