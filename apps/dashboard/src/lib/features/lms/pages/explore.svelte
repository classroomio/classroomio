<script lang="ts">
  import { Spinner } from '@cio/ui/base/spinner';
  import { Empty } from '@cio/ui/custom/empty';
  import { PathIcon } from '@cio/ui/custom/moving-icons';
  import { Search } from '@cio/ui/custom/search';
  import { t } from '$lib/utils/functions/translations';
  import { profile } from '$lib/utils/store/user';
  import { currentOrg } from '$lib/utils/store/org';
  import { learningPathApi } from '$features/learning-path/api/learning-path.svelte';
  import { MOCK_PATHS, MOCK_STANDALONE_COURSES } from '$features/learning-path/utils/mock-data';
  import type { PathDifficulty } from '$features/learning-path/utils/types';
  import type { CourseDurationFilter } from '$features/learning-path/components/types';
  import FilterPopover, { type FilterGroup } from '$features/learning-path/components/filter-popover.svelte';
  import ExplorePathCard from '$features/learning-path/components/explore-path-card.svelte';
  import ExploreCourseCard from '$features/learning-path/components/explore-course-card.svelte';

  type ContentTypeFilter = 'ALL' | 'paths' | 'courses';

  const COURSE_DIFFICULTIES: PathDifficulty[] = ['Beginner', 'Intermediate', 'Advanced'];

  let searchValue = $state('');
  let contentType = $state<ContentTypeFilter>('ALL');
  let difficulty = $state<PathDifficulty | 'ALL'>('ALL');
  let duration = $state<CourseDurationFilter | 'ALL'>('ALL');

  function difficultyForId(id: string): PathDifficulty {
    const sum = Array.from(id).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return COURSE_DIFFICULTIES[sum % COURSE_DIFFICULTIES.length];
  }

  function formatHoursAndMinutes(totalHours: number): string {
    const totalMinutes = Math.round(totalHours * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) return `${minutes} min`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  }

  $effect(() => {
    if (!$profile.id || !$currentOrg.id) return;

    if (!learningPathApi.hasLoaded) {
      learningPathApi.listEnrolled();
    }
  });

  const enrolledIds = $derived(new Set(learningPathApi.enrolledPaths.map((path) => path.id)));

  const catalogPaths = $derived(MOCK_PATHS.filter((path) => path.status === 'ACTIVE' && !enrolledIds.has(path.id)));

  const pathItems = $derived(
    catalogPaths.map((path) => ({
      id: path.id,
      href: `/lms/paths/${path.id}`,
      name: path.name,
      description: path.description,
      coverGradient: path.coverGradient,
      coverImage: path.coverImage,
      courseCount: path.courses.length,
      totalHours: path.courses.reduce((sum, course) => sum + course.durationHours, 0),
      difficulty: path.difficulty
    }))
  );

  const courseItems = $derived([
    ...catalogPaths
      .map((path) => {
        const course = path.courses[0];
        if (!course) return null;

        return {
          id: course.id,
          title: course.title,
          coverGradient: course.coverGradient,
          coverImage: course.coverImage,
          durationHours: course.durationHours,
          difficulty: path.difficulty,
          partOfPath: { name: path.name, href: `/lms/paths/${path.id}` },
          href: `/lms/paths/${path.id}`
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null),
    ...MOCK_STANDALONE_COURSES.map((course) => ({
      id: course.id,
      title: course.title,
      coverGradient: course.coverGradient,
      coverImage: course.coverImage,
      durationHours: course.durationHours,
      difficulty: difficultyForId(course.id),
      partOfPath: null,
      href: '/lms/mylearning/courses'
    }))
  ]);

  const matchesDuration = (hours: number) => {
    if (duration === 'under-1') return hours < 1;
    if (duration === '1-4') return hours >= 1 && hours < 4;
    if (duration === '4-up') return hours >= 4;
    return true;
  };

  const matchesSearch = (text: string) => !searchValue || text.toLowerCase().includes(searchValue.toLowerCase());

  const filteredPaths = $derived(
    pathItems.filter(
      (path) =>
        matchesSearch(`${path.name} ${path.description}`) &&
        (difficulty === 'ALL' || path.difficulty === difficulty) &&
        matchesDuration(path.totalHours)
    )
  );

  const filteredCourses = $derived(
    courseItems.filter(
      (course) =>
        matchesSearch(course.title) &&
        (difficulty === 'ALL' || course.difficulty === difficulty) &&
        matchesDuration(course.durationHours)
    )
  );

  const showPathsSection = $derived(contentType !== 'courses');
  const showCoursesSection = $derived(contentType !== 'paths');

  const selected = $derived<Record<string, string>>({ contentType, difficulty, duration });

  const groups = $derived<FilterGroup[]>([
    {
      id: 'contentType',
      label: $t('explore.content_type'),
      options: [
        { value: 'ALL', label: $t('explore.content_type_all') },
        { value: 'paths', label: $t('learningPath.badge.learning_path') },
        { value: 'courses', label: $t('learningPath.badge.course') }
      ]
    },
    {
      id: 'difficulty',
      label: $t('learningPath.toolbar.difficulty'),
      options: [
        { value: 'ALL', label: $t('learningPath.toolbar.difficulty_any') },
        { value: 'Beginner', label: $t('learningPath.toolbar.difficulty_beginner') },
        { value: 'Intermediate', label: $t('learningPath.toolbar.difficulty_intermediate') },
        { value: 'Advanced', label: $t('learningPath.toolbar.difficulty_advanced') }
      ]
    },
    {
      id: 'duration',
      label: $t('learningPath.toolbar.duration'),
      options: [
        { value: 'ALL', label: $t('learningPath.toolbar.duration_any') },
        { value: 'under-1', label: $t('learningPath.toolbar.duration_under1') },
        { value: '1-4', label: $t('learningPath.toolbar.duration_1to4') },
        { value: '4-up', label: $t('learningPath.toolbar.duration_4up') }
      ]
    }
  ]);

  function handleFilterChange(groupId: string, value: string) {
    if (groupId === 'contentType') contentType = value as ContentTypeFilter;
    if (groupId === 'difficulty') difficulty = value as PathDifficulty | 'ALL';
    if (groupId === 'duration') duration = value as CourseDurationFilter | 'ALL';
  }
</script>

{#if !learningPathApi.hasLoaded}
  <div class="flex min-h-64 items-center justify-center">
    <Spinner />
  </div>
{:else}
  <div class="mb-6 flex flex-wrap items-center gap-3">
    <Search
      class="ui:w-full ui:max-w-none min-w-[220px] flex-1"
      placeholder={$t('explore.search_placeholder')}
      bind:value={searchValue}
    />
    <FilterPopover {groups} {selected} onChange={handleFilterChange} />
  </div>

  {#if showPathsSection}
    <section class="mt-2">
      <div class="mb-3 flex items-center gap-2">
        <h2 class="text-base font-semibold">{$t('explore.section_paths')}</h2>
        <span
          class="ui:text-muted-foreground ui:bg-muted inline-flex min-w-[22px] items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold"
        >
          {filteredPaths.length}
        </span>
      </div>

      {#if filteredPaths.length === 0}
        <Empty
          icon={PathIcon}
          title={$t('explore.paths_empty_title')}
          description={$t('explore.paths_empty_description')}
        />
      {:else}
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          {#each filteredPaths as path}
            <ExplorePathCard
              href={path.href}
              name={path.name}
              description={path.description}
              coverGradient={path.coverGradient}
              coverImage={path.coverImage}
              courseCount={path.courseCount}
              durationLabel={formatHoursAndMinutes(path.totalHours)}
              ctaLabel={$t('explore.view_learning_path')}
            />
          {/each}
        </div>
      {/if}
    </section>
  {/if}

  {#if showCoursesSection}
    <section class="mt-8">
      <div class="mb-3 flex items-center gap-2">
        <h2 class="text-base font-semibold">{$t('explore.section_courses')}</h2>
        <span
          class="ui:text-muted-foreground ui:bg-muted inline-flex min-w-[22px] items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold"
        >
          {filteredCourses.length}
        </span>
      </div>

      {#if filteredCourses.length === 0}
        <Empty
          icon={PathIcon}
          title={$t('explore.courses_empty_title')}
          description={$t('explore.courses_empty_description')}
        />
      {:else}
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {#each filteredCourses as course}
            <ExploreCourseCard
              href={course.href}
              title={course.title}
              coverGradient={course.coverGradient}
              coverImage={course.coverImage}
              durationLabel={formatHoursAndMinutes(course.durationHours)}
              partOfPath={course.partOfPath}
              ctaLabel={$t('learningPath.course.view_course')}
            />
          {/each}
        </div>
      {/if}
    </section>
  {/if}
{/if}
