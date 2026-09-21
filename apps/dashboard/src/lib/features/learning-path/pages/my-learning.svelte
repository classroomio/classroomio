<script lang="ts">
  import { Spinner } from '@cio/ui/base/spinner';
  import { Empty } from '@cio/ui/custom/empty';
  import { PathIcon } from '@cio/ui/custom/moving-icons';
  import { CourseCard, LearningPathCard, type CourseCardLabels, type LearningPathCardLabels } from '@cio/ui';
  import { t } from '$lib/utils/functions/translations';
  import type { Component } from 'svelte';
  import UserIcon from '@lucide/svelte/icons/user';
  import CircleDotIcon from '@lucide/svelte/icons/circle-dot';
  import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
  import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
  import GlobeIcon from '@lucide/svelte/icons/globe';
  import { coursesApi } from '$features/course/api';
  import { profile } from '$lib/utils/store/user';
  import { currentOrg } from '$lib/utils/store/org';
  import { getStudentCourseProgressPercent, isStudentCourseComplete } from '$features/course/utils/compliance-utils';
  import { learningPathApi } from '../api/learning-path.svelte';
  import { getMockPathById } from '../utils/mock-data';
  import type { LearningPathWithEnrollment, PathDifficulty } from '../utils/types';
  import type { CourseLibraryItem, CourseStatus, LearningPathView } from '../components/types';
  import CurrentlyLearningHero from '../components/currently-learning-hero.svelte';
  import LearningPathRow from '../components/learning-path-row.svelte';
  import LibraryToolbar from '../components/library-toolbar.svelte';
  import CourseLibraryRow from '../components/course-library-row.svelte';

  type LibraryEntry = { kind: 'path'; path: LearningPathWithEnrollment } | { kind: 'course'; item: CourseLibraryItem };

  let status = $state<CourseStatus | 'ALL'>('ALL');
  let difficulty = $state<PathDifficulty | 'ALL'>('ALL');
  let view = $state<LearningPathView>('grid');

  const COURSE_DIFFICULTIES: PathDifficulty[] = ['Beginner', 'Intermediate', 'Advanced'];

  function difficultyForId(id: string): PathDifficulty {
    const sum = Array.from(id).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return COURSE_DIFFICULTIES[sum % COURSE_DIFFICULTIES.length];
  }

  $effect(() => {
    if (!$profile.id || !$currentOrg.id) return;

    if (!learningPathApi.hasLoaded) {
      learningPathApi.listEnrolled();
    }
    coursesApi.getEnrolledCourses();
  });

  const isLoading = $derived(learningPathApi.isLoading && learningPathApi.enrolledPaths.length === 0);

  const pathCompletionProgress = $derived((path: LearningPathWithEnrollment) => {
    const enrollment = path.enrollment;
    const done = enrollment?.coursesCompleted ?? 0;
    const total = enrollment?.totalCourses ?? 0;

    return {
      progressPercent: enrollment?.progressPercent ?? 0,
      coursesCompleted: done,
      courseCount: total
    };
  });

  const filteredPaths = $derived(
    learningPathApi.enrolledPaths.filter((path) => {
      if (status !== 'ALL' && path.enrollment?.state !== status) return false;
      if (difficulty !== 'ALL' && path.difficulty !== difficulty) return false;

      return true;
    })
  );

  const pathCourseItems = $derived.by<CourseLibraryItem[]>(() =>
    learningPathApi.enrolledPaths.flatMap((path) => {
      const mockPath = getMockPathById(path.id);

      return learningPathApi.getPathCourses(path).map((course) => ({
        id: course.courseId,
        title: course.title,
        description: mockPath?.courses.find((item) => item.id === course.courseId)?.description ?? '',
        coverGradient: course.coverGradient,
        coverImage: course.coverImage,
        difficulty: path.difficulty,
        status: (course.state === 'LOCKED' ? 'NOT_STARTED' : course.state) as CourseStatus,
        progressPercent: course.progressPercent,
        partOfPath: { id: path.id, name: path.name, href: `/lms/paths/${path.id}` },
        href: `/courses/${course.courseId}/lessons?next=true`,
        lessonCount: course.lessonCount,
        exerciseCount: course.exerciseCount,
        courseType: course.courseType
      }));
    })
  );

  const standaloneCourseItems = $derived.by<CourseLibraryItem[]>(() =>
    coursesApi.enrolledCourses
      .filter((course) => !pathCourseItems.some((item) => item.title.toLowerCase() === course.title.toLowerCase()))
      .map((course) => {
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
          difficulty: difficultyForId(course.id),
          status: state,
          progressPercent,
          partOfPath: null,
          href: `/courses/${course.id}/lessons?next=true`,
          lessonCount: course.lessonCount ?? undefined,
          exerciseCount: course.exerciseCount ?? undefined,
          courseType: course.type ?? undefined
        };
      })
  );

  const allCourseItems = $derived([...pathCourseItems, ...standaloneCourseItems]);

  const filteredCourses = $derived(
    standaloneCourseItems.filter((item) => {
      if (status !== 'ALL' && item.status !== status) return false;
      if (difficulty !== 'ALL' && item.difficulty !== difficulty) return false;

      return true;
    })
  );

  const combinedItems = $derived.by<LibraryEntry[]>(() => [
    ...filteredPaths.map((path) => ({ kind: 'path' as const, path })),
    ...filteredCourses.map((item) => ({ kind: 'course' as const, item }))
  ]);

  const hasAnyItem = $derived(learningPathApi.enrolledPaths.length > 0 || standaloneCourseItems.length > 0);

  const activePath = $derived(learningPathApi.activePath);

  const activeCourse = $derived(
    allCourseItems
      .filter((item) => item.status === 'IN_PROGRESS')
      .sort((a, b) => b.progressPercent - a.progressPercent)[0] ?? null
  );

  const heroType = $derived.by<'path' | 'course' | null>(() => {
    if (activePath && activeCourse) {
      const pathProgress = activePath.enrollment?.progressPercent ?? 0;
      return pathProgress >= activeCourse.progressPercent ? 'path' : 'course';
    }
    if (activePath) return 'path';
    if (activeCourse) return 'course';
    return null;
  });

  const courseLessonsLabel = $derived.by(() => {
    if (!activeCourse) return '';

    const path = learningPathApi.enrolledPaths.find((enrolled) =>
      learningPathApi.getPathCourses(enrolled).some((c) => c.courseId === activeCourse.id)
    );

    if (!path) return '';

    const course = path.courses.find((c) => c.id === activeCourse.id);
    if (!course) return '';

    const done = course.lessonsCompleted;
    const total = course.lessonCount;

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

  const courseTypeBadgeFor = (courseType?: string) => {
    if (!courseType) return undefined;

    const meta: Record<
      string,
      {
        label: string;
        icon: Component;
        iconClass: string;
      }
    > = {
      LIVE_CLASS: {
        label: $t('learningPath.course.type_live_class'),
        icon: CircleDotIcon,
        iconClass: 'size-3 text-red-600 shrink-0'
      },
      SELF_PACED: {
        label: $t('learningPath.course.type_self_paced'),
        icon: UserIcon,
        iconClass: 'size-3 text-primary shrink-0'
      },
      COMPLIANCE: {
        label: $t('learningPath.course.type_compliance'),
        icon: ShieldCheckIcon,
        iconClass: 'size-3 text-emerald-600 shrink-0'
      },
      SPECIALIZATION: {
        label: $t('specialization.course_tag'),
        icon: TrendingUpIcon,
        iconClass: 'size-3 text-amber-600 shrink-0'
      },
      PUBLIC: {
        label: $t('learningPath.course.type_public'),
        icon: GlobeIcon,
        iconClass: 'size-3 text-primary shrink-0'
      }
    };

    const match = meta[courseType];
    if (!match) {
      return undefined;
    }

    return {
      label: match.label,
      icon: match.icon,
      iconClass: match.iconClass
    };
  };
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
        name={activePath.name}
        coverGradient={activePath.coverGradient}
        coverImage={activePath.coverImage}
        courseCount={pathCompletionProgress(activePath).courseCount}
        progressPercent={pathCompletionProgress(activePath).progressPercent}
        coursesCompleted={pathCompletionProgress(activePath).coursesCompleted}
        href={`/lms/paths/${activePath.id}`}
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
        coverGradient={activeCourse.coverGradient}
        coverImage={activeCourse.coverImage}
        partOfPathName={activeCourse.partOfPath?.name}
        pathHref={activeCourse.partOfPath?.href}
        progressPercent={activeCourse.progressPercent}
        lessonsLabel={courseLessonsLabel}
      />
    </section>
  {/if}

  {#if hasAnyItem}
    <section>
      <div class="mb-4">
        <LibraryToolbar bind:status bind:difficulty bind:view />
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
                href={`/lms/paths/${entry.path.id}`}
                name={entry.path.name}
                description={entry.path.description}
                coverGradient={entry.path.coverGradient}
                coverImage={entry.path.coverImage}
                courseCount={pathCompletionProgress(entry.path).courseCount}
                progressPercent={pathCompletionProgress(entry.path).progressPercent}
                coursesCompleted={pathCompletionProgress(entry.path).coursesCompleted}
                certificateEarned={Boolean(entry.path.enrollment?.certificateId)}
                labels={learningPathCardLabels}
              />
            {:else}
              <CourseCard
                isLMS
                href={entry.item.href}
                title={entry.item.title}
                description={entry.item.description}
                coverImage={entry.item.coverImage}
                typeBadge={courseTypeBadgeFor(entry.item.courseType)}
                status={entry.item.status}
                progressPercent={entry.item.progressPercent}
                partOfPath={entry.item.partOfPath}
                lessonCount={entry.item.lessonCount}
                exerciseCount={entry.item.exerciseCount}
                labels={courseCardLabels}
              />
            {/if}
          {/each}
        </div>
      {:else}
        <div class="flex flex-col gap-3 divide-y rounded-md border">
          {#each combinedItems as entry (entry.kind === 'path' ? entry.path.id : entry.item.id)}
            {#if entry.kind === 'path'}
              <LearningPathRow
                href={`/lms/paths/${entry.path.id}`}
                name={entry.path.name}
                description={entry.path.description}
                coverGradient={entry.path.coverGradient}
                coverImage={entry.path.coverImage}
                courseCount={pathCompletionProgress(entry.path).courseCount}
                progressPercent={pathCompletionProgress(entry.path).progressPercent}
                coursesCompleted={pathCompletionProgress(entry.path).coursesCompleted}
                certificateEarned={Boolean(entry.path.enrollment?.certificateId)}
              />
            {:else}
              <CourseLibraryRow
                href={entry.item.href}
                title={entry.item.title}
                description={entry.item.description}
                coverGradient={entry.item.coverGradient}
                coverImage={entry.item.coverImage}
                status={entry.item.status}
                progressPercent={entry.item.progressPercent}
                partOfPath={entry.item.partOfPath}
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
    <Empty icon={PathIcon} title={$t('learningPath.empty.title')} description={$t('learningPath.empty.description')} />
  {/if}
{/if}
