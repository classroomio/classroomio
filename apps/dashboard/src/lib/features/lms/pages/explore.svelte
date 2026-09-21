<script lang="ts">
  import { Spinner } from '@cio/ui/base/spinner';
  import { Empty } from '@cio/ui/custom/empty';
  import { PathIcon } from '@cio/ui/custom/moving-icons';
  import { Search } from '@cio/ui/custom/search';
  import { CourseCard, LearningPathCard, type CourseCardLabels, type LearningPathCardLabels } from '@cio/ui';
  import { t } from '$lib/utils/functions/translations';
  import { profile } from '$lib/utils/store/user';
  import { currentOrg } from '$lib/utils/store/org';
  import { learningPathApi } from '$features/learning-path/api/learning-path.svelte';
  import { MOCK_PATHS, MOCK_STANDALONE_COURSES } from '$features/learning-path/utils/mock-data';
  import type { PathDifficulty } from '$features/learning-path/utils/types';
  import CourseFilterPopover, { type FilterGroup } from '$features/course/components/course-filter-popover.svelte';
  import CoursePreviewModal, { type CoursePreviewCourse } from '$features/lms/components/course-preview-modal.svelte';

  type ContentTypeFilter = 'ALL' | 'paths' | 'courses';

  interface ExploreCourseCard {
    id: string;
    title: string;
    description: string;
    coverGradient?: string;
    coverImage?: string;
    lessonCount: number;
    exerciseCount: number;
    difficulty: PathDifficulty;
    partOfPath: { name: string; href: string } | null;
    href: string;
    slug?: string;
    cost: number;
  }

  const COURSE_DIFFICULTIES: PathDifficulty[] = ['Beginner', 'Intermediate', 'Advanced'];

  let searchValue = $state('');
  let contentType = $state<ContentTypeFilter>('ALL');
  let difficulty = $state<PathDifficulty | 'ALL'>('ALL');
  let selectedCourse = $state<CoursePreviewCourse | null>(null);
  let previewOpen = $state(false);

  function difficultyForId(id: string): PathDifficulty {
    const sum = Array.from(id).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return COURSE_DIFFICULTIES[sum % COURSE_DIFFICULTIES.length];
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
      difficulty: path.difficulty
    }))
  );

  const courseItems = $derived<ExploreCourseCard[]>([
    ...catalogPaths
      .map((path) => {
        const course = path.courses[0];
        if (!course) return null;

        return {
          id: course.id,
          title: course.title,
          description: course.description,
          coverGradient: course.coverGradient,
          coverImage: course.coverImage,
          lessonCount: course.lessonCount,
          exerciseCount: course.exerciseCount,
          difficulty: path.difficulty,
          partOfPath: { name: path.name, href: `/lms/paths/${path.id}` },
          href: `/lms/paths/${path.id}`,
          slug: course.slug,
          cost: course.cost
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null),
    ...MOCK_STANDALONE_COURSES.map((course) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      coverGradient: course.coverGradient,
      coverImage: course.coverImage,
      lessonCount: course.lessonCount,
      exerciseCount: course.exerciseCount,
      difficulty: difficultyForId(course.id),
      partOfPath: null,
      href: '/lms/mylearning',
      slug: course.slug,
      cost: course.cost
    }))
  ]);

  const matchesSearch = (text: string) => !searchValue || text.toLowerCase().includes(searchValue.toLowerCase());

  const filteredPaths = $derived(
    pathItems.filter(
      (path) =>
        matchesSearch(`${path.name} ${path.description}`) && (difficulty === 'ALL' || path.difficulty === difficulty)
    )
  );

  const filteredCourses = $derived(
    courseItems.filter(
      (course) => matchesSearch(course.title) && (difficulty === 'ALL' || course.difficulty === difficulty)
    )
  );

  const showPathsSection = $derived(contentType !== 'courses');
  const showCoursesSection = $derived(contentType !== 'paths');

  const selected = $derived<Record<string, string>>({ contentType, difficulty });

  const hasActiveFilters = $derived(contentType !== 'ALL' || difficulty !== 'ALL');

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
    }
  ]);

  const pathLabels = $derived<LearningPathCardLabels>({
    badge: $t('learningPath.badge.learning_path'),
    course: $t('learningPath.card.course'),
    courses: $t('learningPath.card.courses'),
    certificateEarned: $t('learningPath.card.certificate_earned'),
    adminContinueSetup: $t('learningPath.admin.continue_setup'),
    adminManage: $t('learningPath.admin.manage'),
    viewCertificate: $t('learningPath.card.view_certificate'),
    viewPath: $t('explore.view_learning_path'),
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

  const courseLabels = $derived<CourseCardLabels>({
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
    continueCourse: $t('courses.course_card.continue_course'),
    reviewCourse: $t('learningPath.course.review_course'),
    viewCertificate: $t('certificates.view_certificate'),
    manage: $t('learningPath.admin.manage'),
    published: $t('courses.course_card.published'),
    unpublished: $t('courses.course_card.unpublished'),
    students: $t('courses.course_card.students')
  });

  function handleFilterChange(groupId: string, value: string) {
    if (groupId === 'contentType') contentType = value as ContentTypeFilter;
    if (groupId === 'difficulty') difficulty = value as PathDifficulty | 'ALL';
  }

  function clearFilters() {
    contentType = 'ALL';
    difficulty = 'ALL';
  }

  function openCoursePreview(course: ExploreCourseCard) {
    selectedCourse = {
      id: course.id,
      title: course.title,
      description: course.description,
      logo: course.coverImage ?? null,
      slug: course.slug,
      lessonCount: course.lessonCount,
      exerciseCount: course.exerciseCount,
      cost: course.cost,
      currency: 'USD',
      metadata: { allowSelfEnrollment: true },
      type: 'PUBLIC'
    };
    previewOpen = true;
  }
</script>

{#if !learningPathApi.hasLoaded}
  <div class="flex min-h-64 items-center justify-center">
    <Spinner />
  </div>
{:else}
  <div class="mb-6 flex flex-wrap items-center justify-end gap-3">
    <Search
      class="max-w-sm flex-1 border md:w-2/3"
      placeholder={$t('explore.search_placeholder')}
      bind:value={searchValue}
    />
    <CourseFilterPopover
      sortOptions={[]}
      {groups}
      selectedGroups={selected}
      onGroupChange={handleFilterChange}
      {hasActiveFilters}
      onClearFilters={clearFilters}
    />
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
        <div class="grid grid-cols-1 gap-4 px-2 md:grid-cols-3">
          {#each filteredPaths as path}
            <LearningPathCard
              href={path.href}
              name={path.name}
              description={path.description}
              coverGradient={path.coverGradient}
              coverImage={path.coverImage}
              courseCount={path.courseCount}
              progressPercent={0}
              coursesCompleted={0}
              isExplore={true}
              labels={pathLabels}
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
            <CourseCard
              href={course.href}
              title={course.title}
              description={course.description}
              coverGradient={course.coverGradient}
              coverImage={course.coverImage}
              lessonCount={course.lessonCount}
              exerciseCount={course.exerciseCount}
              partOfPath={course.partOfPath}
              isExplore={true}
              onExploreClick={() => openCoursePreview(course)}
              labels={courseLabels}
            />
          {/each}
        </div>
      {/if}
    </section>
  {/if}
{/if}

{#if selectedCourse}
  <CoursePreviewModal course={selectedCourse} bind:open={previewOpen} />
{/if}
