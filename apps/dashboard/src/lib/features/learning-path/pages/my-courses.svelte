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
  import type { PathDifficulty } from '../utils/types';
  import type { CourseDurationFilter, CourseLibraryItem, CourseStatus, LearningPathView } from '../components/types';
  import CurrentlyLearningCourseHero from '../components/currently-learning-course-hero.svelte';
  import CourseLibraryCard from '../components/course-library-card.svelte';
  import CourseLibraryRow from '../components/course-library-row.svelte';
  import CourseLibraryToolbar from '../components/course-library-toolbar.svelte';
  import ExploreMoreCourses from '../components/explore-more-courses.svelte';

  let status = $state<CourseStatus | 'ALL'>('ALL');
  let difficulty = $state<PathDifficulty | 'ALL'>('ALL');
  let duration = $state<CourseDurationFilter | 'ALL'>('ALL');
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
    coursesApi.getRecommendedCourses({ limit: 3 });
  });

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

  const items = $derived([...pathCourseItems, ...standaloneCourseItems]);

  const filtered = $derived(
    items.filter((item) => {
      if (status !== 'ALL' && item.status !== status) return false;
      if (difficulty !== 'ALL' && item.difficulty !== difficulty) return false;

      if (duration === 'under-1' && item.durationHours > 1) return false;
      if (duration === '1-4' && (item.durationHours <= 1 || item.durationHours > 4)) return false;
      if (duration === '4-up' && item.durationHours <= 4) return false;

      return true;
    })
  );

  const weeksLabel = (item: CourseLibraryItem) =>
    `${Math.max(2, Math.round(item.durationHours / 2))} ${$t('learningPath.course.weeks')}`;

  const activeCourse = $derived(
    items.filter((item) => item.status === 'IN_PROGRESS').sort((a, b) => b.progressPercent - a.progressPercent)[0] ??
      null
  );

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

  const exploreCourses = $derived.by(() =>
    learningPathApi.explorePaths.map((path) => {
      const mockPath = getMockPathById(path.id);
      const course = mockPath?.courses[0];

      return {
        id: course?.id ?? path.id,
        title: course?.title ?? path.name,
        coverGradient: course?.coverGradient ?? path.coverGradient,
        coverImage: course?.coverImage ?? path.coverImage,
        metaLabel: course ? `${Math.max(1, Math.round(course.durationHours * 60))} min` : '',
        partOfPathName: path.name
      };
    })
  );
</script>

{#if learningPathApi.isLoading && items.length === 0}
  <div class="flex min-h-64 items-center justify-center">
    <Spinner />
  </div>
{:else}
  <section class="mb-5">
    {#if activeCourse}
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
    {/if}

    <div class="mt-8 mb-3 flex items-center justify-between">
      <h2 class="text-base font-semibold">{$t('learningPath.my_learning.heading_courses')}</h2>
    </div>

    <div class="mb-4">
      <CourseLibraryToolbar bind:status bind:difficulty bind:duration bind:view />
    </div>

    {#if filtered.length === 0}
      <Empty
        icon={PathIcon}
        title={$t('learningPath.empty.courses_empty_title')}
        description={$t('learningPath.empty.courses_empty_description')}
      />
    {:else if view === 'grid'}
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {#each filtered as item}
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
        {#each filtered as item}
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

    <!-- {#if exploreCourses.length > 0}
      <ExploreMoreCourses items={exploreCourses} />
    {/if} -->
  </section>
{/if}
