<script lang="ts">
  import { Spinner } from '@cio/ui/base/spinner';
  import { Empty } from '@cio/ui/custom/empty';
  import { PathIcon } from '@cio/ui/custom/moving-icons';
  import { CourseCard, LearningPathCard, type CourseCardLabels, type LearningPathCardLabels } from '@cio/ui';
  import { t } from '$lib/utils/functions/translations';
  import {
    getCourseTypeBadgeMeta,
    getCourseVisibilityBadgeMeta,
    toCourseCardBadge
  } from '$features/course/utils/course-card-badges';
  import { coursesApi } from '$features/course/api';
  import { profile } from '$lib/utils/store/user';
  import { currentOrg } from '$lib/utils/store/org';
  import { getStudentCourseProgressPercent, isStudentCourseComplete } from '$features/course/utils/compliance-utils';
  import { learnerPathStore } from '../api/learning-path.svelte';
  import type { EnrolledPath } from '$features/lms/utils/types';
  import type { CourseLibraryItem, CourseStatus, LearningPathView } from '../components/types';
  import CurrentlyLearningHero from '../components/currently-learning-hero.svelte';
  import LearningPathRow from '../components/learning-path-row.svelte';
  import LibraryToolbar from '../components/library-toolbar.svelte';
  import CourseLibraryRow from '../components/course-library-row.svelte';

  type LibraryEntry = { kind: 'path'; path: EnrolledPath } | { kind: 'course'; item: CourseLibraryItem };

  let status = $state<CourseStatus | 'ALL'>('ALL');
  let view = $state<LearningPathView>('grid');

  $effect(() => {
    if (!$profile.id || !$currentOrg.id) return;

    learnerPathStore.ensureLoadedFor($currentOrg.id, $profile.id);
  });

  const isLoading = $derived(learnerPathStore.isLoading && learnerPathStore.enrolledPaths.length === 0);

  const pathCompletionProgress = $derived((path: EnrolledPath) => {
    return {
      progressPercent: path.progress,
      coursesCompleted: path.completedItems,
      courseCount: path.totalItems
    };
  });

  const filteredPaths = $derived(
    learnerPathStore.unfinishedPaths.filter((path) => {
      if (status !== 'ALL' && learnerPathStore.getPathStatus(path) !== status) return false;

      return true;
    })
  );

  const standaloneCourseItems = $derived.by<CourseLibraryItem[]>(() =>
    coursesApi.enrolledCourses.map((course) => {
      const progressPercent = isStudentCourseComplete(course) ? 100 : getStudentCourseProgressPercent(course);
      const state: CourseStatus = isStudentCourseComplete(course)
        ? 'COMPLETED'
        : progressPercent > 0
          ? 'IN_PROGRESS'
          : 'NOT_STARTED';

      return {
        id: course.id,
        title: course.title,
        description: course.description ?? '',
        coverImage: course.logo || undefined,
        status: state,
        progressPercent,
        progressRate: course.progressRate ?? 0,
        partOfPath: null,
        href: `/courses/${course.id}/lessons?next=true`,
        lessonCount: course.lessonCount ?? undefined,
        exerciseCount: course.exerciseCount ?? undefined,
        courseType: course.type ?? undefined
      };
    })
  );

  const filteredCourses = $derived(
    standaloneCourseItems.filter((item) => {
      if (status !== 'ALL' && item.status !== status) return false;

      return true;
    })
  );

  const combinedItems = $derived.by<LibraryEntry[]>(() => [
    ...filteredPaths.map((path) => ({ kind: 'path' as const, path })),
    ...filteredCourses.map((item) => ({ kind: 'course' as const, item }))
  ]);

  const hasAnyItem = $derived(learnerPathStore.unfinishedPaths.length > 0 || standaloneCourseItems.length > 0);

  const activePath = $derived(learnerPathStore.activePath);

  const activeCourse = $derived(
    standaloneCourseItems
      .filter((item) => item.status === 'IN_PROGRESS')
      .sort((a, b) => b.progressPercent - a.progressPercent)[0] ?? null
  );

  const heroType = $derived.by<'path' | 'course' | null>(() => {
    const activePathCompleted = activePath ? learnerPathStore.getPathStatus(activePath) === 'COMPLETED' : false;

    if (activePath && activeCourse) {
      if (activePathCompleted) return 'course';

      const pathProgress = activePath.progress ?? 0;
      return pathProgress >= activeCourse.progressPercent ? 'path' : 'course';
    }
    if (activePath) return 'path';
    if (activeCourse) return 'course';
    return null;
  });

  const courseLessonsLabel = $derived.by(() => {
    if (!activeCourse) return '';

    const done = activeCourse.progressRate ?? 0;
    const total = activeCourse.lessonCount ?? 0;
    if (!total) return '';

    return `${done} ${$t('learningPath.card.of')} ${total} ${$t('learningPath.enrollment.lessons_label')}`;
  });

  const courseCardLabels = $derived<CourseCardLabels>({
    courseBadge: $t('learningPath.badge.course'),
    lesson: $t('learningPath.card.lesson'),
    lessons: $t('learningPath.card.lessons'),
    exercise: $t('learningPath.card.exercise'),
    exercises: $t('learningPath.card.exercises'),
    completedLabel: $t('learningPath.course.completed_label'),
    progressLabel: $t('learningPath.progress.label'),
    earnedOn: $t('certificates.earned_on'),
    partOf: $t('learningPath.course.part_of'),
    learnMore: $t('courses.course_card.learn_more'),
    continueCourse: $t('learningPath.course.continue_course'),
    reviewCourse: $t('learningPath.course.review_course'),
    viewCertificate: $t('learningPath.card.view_certificate'),
    manage: $t('learningPath.admin.manage'),
    published: $t('courses.course_card.published'),
    unpublished: $t('courses.course_card.unpublished'),
    students: $t('courses.course_card.students')
  });

  const learningPathCardLabels = $derived<LearningPathCardLabels>({
    badge: $t('learningPath.badge.learning_path'),
    course: $t('learningPath.card.course'),
    courses: $t('learningPath.card.courses'),
    certificateEarned: $t('learningPath.card.certificate_earned'),
    adminContinueSetup: $t('learningPath.admin.continue_setup'),
    adminManage: $t('learningPath.admin.manage'),
    viewCertificate: $t('learningPath.card.view_certificate'),
    viewPath: $t('learningPath.hero.view_path'),
    startLearning: $t('learningPath.hero.start_learning'),
    continueLearning: $t('learningPath.hero.continue_learning'),
    statusDraft: $t('learningPath.status.draft'),
    statusActive: $t('learningPath.status.active'),
    statusArchived: $t('learningPath.status.archived'),
    progressLabel: $t('learningPath.progress.label'),
    of: $t('learningPath.card.of'),
    coursesCompleted: $t('learningPath.hero.courses_completed'),
    earnedOn: $t('certificates.earned_on')
  });
</script>

{#if isLoading}
  <div class="flex min-h-64 items-center justify-center">
    <Spinner />
  </div>
{:else}
  {#if heroType === 'path' && activePath}
    <section class="mb-5">
      <div class="mb-2 flex items-center justify-between">
        <h2 class="text-base font-semibold">{$t('learningPath.my_learning.currently_learning')}</h2>
      </div>
      <CurrentlyLearningHero
        variant="path"
        pathId={activePath.id}
        name={activePath.name}
        coverImage={activePath.coverImage}
        courseCount={pathCompletionProgress(activePath).courseCount}
        progressPercent={pathCompletionProgress(activePath).progressPercent}
        coursesCompleted={pathCompletionProgress(activePath).coursesCompleted}
        href={`/lms/paths/${activePath.publicId ?? activePath.id}`}
      />
    </section>
  {:else if heroType === 'course' && activeCourse}
    <section class="mb-5">
      <div class="mb-2 flex items-center justify-between">
        <h2 class="text-base font-semibold">{$t('learningPath.my_learning.currently_learning')}</h2>
      </div>
      <CurrentlyLearningHero
        variant="course"
        title={activeCourse.title}
        href={activeCourse.href}
        coverImage={activeCourse.coverImage}
        progressPercent={activeCourse.progressPercent}
        lessonsLabel={courseLessonsLabel}
      />
    </section>
  {/if}

  {#if hasAnyItem}
    <section>
      <div class="mb-4">
        <LibraryToolbar bind:status bind:view />
      </div>

      {#if combinedItems.length === 0}
        <Empty
          icon={PathIcon}
          title={$t('learningPath.empty.library_no_results_title')}
          description={$t('learningPath.empty.library_no_results_description')}
        />
      {:else if view === 'grid'}
        <div class="grid grid-cols-1 gap-4 ps-2 sm:grid-cols-2 xl:grid-cols-3">
          {#each combinedItems as entry (entry.kind === 'path' ? entry.path.id : entry.item.id)}
            {#if entry.kind === 'path'}
              <LearningPathCard
                isLMS
                href={`/lms/paths/${entry.path.publicId ?? entry.path.id}`}
                name={entry.path.name}
                description={entry.path.description ?? ''}
                coverImage={entry.path.coverImage}
                courseCount={pathCompletionProgress(entry.path).courseCount}
                progressPercent={pathCompletionProgress(entry.path).progressPercent}
                coursesCompleted={pathCompletionProgress(entry.path).coursesCompleted}
                certificateEarned={learnerPathStore.hasPathCertificate(entry.path.id)}
                labels={learningPathCardLabels}
              />
            {:else}
              <CourseCard
                isLMS
                href={entry.item.href}
                title={entry.item.title}
                description={entry.item.description}
                coverImage={entry.item.coverImage}
                typeBadge={toCourseCardBadge(getCourseTypeBadgeMeta(entry.item.courseType), $t)}
                visibilityBadge={toCourseCardBadge(getCourseVisibilityBadgeMeta(entry.item.courseType), $t)}
                status={entry.item.status}
                progressPercent={entry.item.progressPercent}
                lessonCount={entry.item.lessonCount}
                exerciseCount={entry.item.exerciseCount}
                labels={courseCardLabels}
              />
            {/if}
          {/each}
        </div>
      {:else}
        <div class="flex flex-col divide-y rounded-md border">
          {#each combinedItems as entry (entry.kind === 'path' ? entry.path.id : entry.item.id)}
            {#if entry.kind === 'path'}
              <LearningPathRow
                pathId={entry.path.id}
                href={`/lms/paths/${entry.path.publicId ?? entry.path.id}`}
                name={entry.path.name}
                description={entry.path.description ?? ''}
                coverImage={entry.path.coverImage}
                courseCount={pathCompletionProgress(entry.path).courseCount}
                progressPercent={pathCompletionProgress(entry.path).progressPercent}
                coursesCompleted={pathCompletionProgress(entry.path).coursesCompleted}
                certificateEarned={learnerPathStore.hasPathCertificate(entry.path.id)}
              />
            {:else}
              <CourseLibraryRow
                href={entry.item.href}
                title={entry.item.title}
                description={entry.item.description}
                coverImage={entry.item.coverImage}
                status={entry.item.status}
                progressPercent={entry.item.progressPercent}
                lessonCount={entry.item.lessonCount}
                exerciseCount={entry.item.exerciseCount}
                courseType={entry.item.courseType}
              />
            {/if}
          {/each}
        </div>
      {/if}
    </section>
  {/if}

  {#if !hasAnyItem}
    <Empty
      icon={PathIcon}
      title={$t('learningPath.empty.library_empty_title')}
      description={$t('learningPath.empty.library_empty_description')}
    />
  {/if}
{/if}
