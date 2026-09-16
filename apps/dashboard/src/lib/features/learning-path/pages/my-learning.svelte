<script lang="ts">
  import { Spinner } from '@cio/ui/base/spinner';
  import { Empty } from '@cio/ui/custom/empty';
  import { PathIcon } from '@cio/ui/custom/moving-icons';
  import { t } from '$lib/utils/functions/translations';
  import { coursesApi } from '$features/course/api';
  import { profile } from '$lib/utils/store/user';
  import { currentOrg } from '$lib/utils/store/org';
  import { getStudentCourseProgressPercent, isStudentCourseComplete } from '$features/course/utils/compliance-utils';
  import { learningPathApi } from '../api/learning-path.svelte';
  import { getMockPathById } from '../utils/mock-data';
  import type { LearningPathStatus, PathDifficulty } from '../utils/types';
  import type {
    CourseDurationFilter,
    CourseLibraryItem,
    CourseStatus,
    DurationFilter,
    LearningPathView
  } from '../components/types';
  import CurrentlyLearningHero from '../components/currently-learning-hero.svelte';
  import CurrentlyLearningCourseHero from '../components/currently-learning-course-hero.svelte';
  import LearningPathCard from '../components/learning-path-card.svelte';
  import LearningPathRow from '../components/learning-path-row.svelte';
  import LearningPathToolbar from '../components/learning-path-toolbar.svelte';
  import CourseLibraryCard from '../components/course-library-card.svelte';
  import CourseLibraryRow from '../components/course-library-row.svelte';
  import CourseLibraryToolbar from '../components/course-library-toolbar.svelte';

  let pathStatus = $state<LearningPathStatus | 'ALL'>('ALL');
  let pathDifficulty = $state<PathDifficulty | 'ALL'>('ALL');
  let pathDuration = $state<DurationFilter | 'ALL'>('ALL');
  let pathView = $state<LearningPathView>('grid');

  let courseStatus = $state<CourseStatus | 'ALL'>('ALL');
  let courseDifficulty = $state<PathDifficulty | 'ALL'>('ALL');
  let courseDuration = $state<CourseDurationFilter | 'ALL'>('ALL');
  let courseView = $state<LearningPathView>('grid');

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

  const totalHours = (path: (typeof learningPathApi.enrolledPaths)[number]) =>
    path.courses.reduce((acc, course) => acc + course.durationHours, 0);

  const pathCompletionProgress = $derived((path: (typeof learningPathApi.enrolledPaths)[number]) => {
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
      if (pathStatus !== 'ALL' && path.enrollment?.state !== pathStatus) return false;
      if (pathDifficulty !== 'ALL' && path.difficulty !== pathDifficulty) return false;

      const hours = totalHours(path);
      if (pathDuration === 'under-4' && hours >= 4) return false;
      if (pathDuration === '4-10' && (hours < 4 || hours >= 10)) return false;
      if (pathDuration === '10-up' && hours < 10) return false;

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
        durationHours: course.durationHours,
        difficulty: path.difficulty,
        status: (course.state === 'LOCKED' ? 'NOT_STARTED' : course.state) as CourseStatus,
        progressPercent: course.progressPercent,
        partOfPath: { id: path.id, name: path.name, href: `/lms/paths/${path.id}` },
        href: `/lms/paths/${path.id}`
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
          durationHours: 8,
          difficulty: difficultyForId(course.id),
          status: state,
          progressPercent,
          partOfPath: null,
          href: `/lms/mylearning`
        };
      })
  );

  const allCourseItems = $derived([...pathCourseItems, ...standaloneCourseItems]);

  const filteredCourses = $derived(
    standaloneCourseItems.filter((item) => {
      if (courseStatus !== 'ALL' && item.status !== courseStatus) return false;
      if (courseDifficulty !== 'ALL' && item.difficulty !== courseDifficulty) return false;

      if (courseDuration === 'under-1' && item.durationHours > 1) return false;
      if (courseDuration === '1-4' && (item.durationHours <= 1 || item.durationHours > 4)) return false;
      if (courseDuration === '4-up' && item.durationHours <= 4) return false;

      return true;
    })
  );

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

  const weeksLabel = (item: CourseLibraryItem) =>
    `${Math.max(2, Math.round(item.durationHours / 2))} ${$t('learningPath.course.weeks')}`;

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
    const leftHours = Math.max(1, Math.round(course.durationHours * (1 - activeCourse.progressPercent / 100)));

    return `${done} ${$t('learningPath.card.of')} ${total} ${$t('learningPath.enrollment.lessons_label')} · ~${leftHours}h ${$t('learningPath.course.time_left')}`;
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
        name={activePath.name}
        description={activePath.description}
        coverGradient={activePath.coverGradient}
        coverImage={activePath.coverImage}
        courseCount={pathCompletionProgress(activePath).courseCount}
        totalHours={totalHours(activePath)}
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
      <CurrentlyLearningCourseHero
        title={activeCourse.title}
        href={activeCourse.href}
        coverGradient={activeCourse.coverGradient}
        coverImage={activeCourse.coverImage}
        weeksLabel={weeksLabel(activeCourse)}
        partOfPathName={activeCourse.partOfPath?.name}
        pathHref={activeCourse.partOfPath?.href}
        progressPercent={activeCourse.progressPercent}
        lessonsLabel={courseLessonsLabel}
      />
    </section>
  {/if}

  {#if learningPathApi.enrolledPaths.length > 0}
    <section class="mb-8">
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-base font-semibold">{$t('learningPath.my_learning.paths_section_title')}</h2>
      </div>

      <div class="mb-4">
        <LearningPathToolbar
          bind:status={pathStatus}
          bind:difficulty={pathDifficulty}
          bind:duration={pathDuration}
          bind:view={pathView}
        />
      </div>

      {#if filteredPaths.length === 0}
        <Empty
          icon={PathIcon}
          title={$t('learningPath.empty.no_results_title')}
          description={$t('learningPath.empty.no_results_description')}
        />
      {:else if pathView === 'grid'}
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-2">
          {#each filteredPaths as path}
            <LearningPathCard
              href={`/lms/paths/${path.id}`}
              name={path.name}
              description={path.description}
              coverGradient={path.coverGradient}
              coverImage={path.coverImage}
              courseCount={pathCompletionProgress(path).courseCount}
              totalHours={totalHours(path)}
              progressPercent={pathCompletionProgress(path).progressPercent}
              coursesCompleted={pathCompletionProgress(path).coursesCompleted}
              certificateEarned={Boolean(path.enrollment?.certificateId)}
            />
          {/each}
        </div>
      {:else}
        <div class="flex flex-col gap-3">
          {#each filteredPaths as path}
            <LearningPathRow
              href={`/lms/paths/${path.id}`}
              name={path.name}
              description={path.description}
              coverGradient={path.coverGradient}
              coverImage={path.coverImage}
              courseCount={pathCompletionProgress(path).courseCount}
              totalHours={totalHours(path)}
              progressPercent={pathCompletionProgress(path).progressPercent}
              coursesCompleted={pathCompletionProgress(path).coursesCompleted}
              certificateEarned={Boolean(path.enrollment?.certificateId)}
            />
          {/each}
        </div>
      {/if}
    </section>
  {/if}

  {#if standaloneCourseItems.length > 0}
    <section class="mb-5">
      <div class="mt-8 mb-3 flex items-center justify-between">
        <h2 class="text-base font-semibold">{$t('learningPath.my_learning.courses_section_title')}</h2>
      </div>

      <div class="mb-4">
        <CourseLibraryToolbar
          bind:status={courseStatus}
          bind:difficulty={courseDifficulty}
          bind:duration={courseDuration}
          bind:view={courseView}
        />
      </div>

      {#if filteredCourses.length === 0}
        <Empty
          icon={PathIcon}
          title={$t('learningPath.empty.courses_empty_title')}
          description={$t('learningPath.empty.courses_empty_description')}
        />
      {:else if courseView === 'grid'}
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {#each filteredCourses as item}
            <CourseLibraryCard
              href={item.href}
              title={item.title}
              description={item.description}
              coverGradient={item.coverGradient}
              coverImage={item.coverImage}
              metaLabel={weeksLabel(item)}
              status={item.status}
              progressPercent={item.progressPercent}
              partOfPath={item.partOfPath}
            />
          {/each}
        </div>
      {:else}
        <div class="flex flex-col gap-3">
          {#each filteredCourses as item}
            <CourseLibraryRow
              href={item.href}
              title={item.title}
              description={item.description}
              coverGradient={item.coverGradient}
              coverImage={item.coverImage}
              metaLabel={weeksLabel(item)}
              status={item.status}
              progressPercent={item.progressPercent}
              partOfPath={item.partOfPath}
            />
          {/each}
        </div>
      {/if}
    </section>
  {/if}

  {#if learningPathApi.enrolledPaths.length === 0 && standaloneCourseItems.length === 0}
    <Empty icon={PathIcon} title={$t('learningPath.empty.title')} description={$t('learningPath.empty.description')} />
  {/if}
{/if}
