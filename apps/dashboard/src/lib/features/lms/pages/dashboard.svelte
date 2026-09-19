<script lang="ts">
  import { goto } from '$app/navigation';
  import { Button } from '@cio/ui/base/button';
  import { Spinner } from '@cio/ui/base/spinner';
  import { Empty } from '@cio/ui/custom/empty';
  import { BlurFade } from '@cio/ui/custom/animation/blurfade';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { CourseCard, LearningPathCard, type CourseCardLabels, type LearningPathCardLabels } from '@cio/ui';
  import { learningPathApi } from '$features/learning-path/api/learning-path.svelte';
  import {
    getMockPathById,
    MOCK_STANDALONE_COURSES,
    MOCK_UPCOMING_EXERCISES
  } from '$features/learning-path/utils/mock-data';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg, currentOrgDomain } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { coursesApi } from '$features/course/api';
  import CoursePreviewModal from '$features/lms/components/course-preview-modal.svelte';
  import type { RecommendedCourses } from '$features/course/types';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import CheckCircle2Icon from '@lucide/svelte/icons/circle-check-big';
  import ClipboardListIcon from '@lucide/svelte/icons/clipboard-list';
  import CopyIcon from '@lucide/svelte/icons/copy';
  import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
  import FileCheckIcon from '@lucide/svelte/icons/file-check';
  import TargetIcon from '@lucide/svelte/icons/target';
  import { copyPublicCoursePageUrl, openCoursePreview } from '$features/course/utils/course-preview';
  import { getStudentCourseProgressPercent, isStudentCourseComplete } from '$features/course/utils/compliance-utils';
  import { getStudentCourseContinuePath } from '$features/course/utils/student-course-navigation';
  import { GitBranch, SquareCheckBig } from '@lucide/svelte';
  import { PathIcon } from '@cio/ui/custom/moving-icons';

  type EnrolledCourse = (typeof coursesApi.enrolledCourses)[number];

  let selectedCourse = $state<RecommendedCourses[number] | null>(null);
  let previewOpen = $state(false);

  let totalCompleted = $derived(
    coursesApi.enrolledCourses.reduce((acc, course) => acc + getCourseCompletedItems(course), 0)
  );

  let totalLessons = $derived(coursesApi.enrolledCourses.reduce((acc, course) => acc + getCourseTotalItems(course), 0));

  let progressPercentage = $derived(totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0);

  let inProgressCourses = $derived(coursesApi.enrolledCourses.filter((course) => !isStudentCourseComplete(course)));
  let completedCourses = $derived(coursesApi.enrolledCourses.filter((course) => isStudentCourseComplete(course)));
  let currentCourse = $derived.by(() => getHighlightedCourses(inProgressCourses)[0] ?? null);
  let shouldShowCertificateHero = $derived.by(() => {
    if (!currentCourse || coursesApi.enrolledCourses.length !== 1) {
      return false;
    }

    return isStudentCourseComplete(currentCourse) && currentCourse.certificateEarnedAt != null;
  });

  const currentPathContext = $derived.by(() => {
    if (!currentCourse) return null;

    for (const path of learningPathApi.enrolledPaths) {
      const courses = learningPathApi.getPathCourses(path);
      const courseIndex = courses.findIndex(
        (course) => course.title.toLowerCase() === currentCourse.title.toLowerCase()
      );

      if (courseIndex >= 0) {
        return {
          pathName: path.name,
          pathHref: `/lms/paths/${path.id}`,
          courseOrder: courseIndex + 1,
          totalCourses: courses.length
        };
      }
    }

    const fallbackPath = learningPathApi.activePath;
    const fallbackCourse = fallbackPath?.enrollment?.currentCourse;

    if (fallbackPath && fallbackCourse) {
      return {
        pathName: fallbackPath.name,
        pathHref: `/lms/paths/${fallbackPath.id}`,
        courseOrder: fallbackCourse.courseIndex + 1,
        totalCourses: fallbackPath.courses.length
      };
    }

    return null;
  });

  const gridPaths = $derived.by(() => [
    ...learningPathApi.inProgressPaths.sort(
      (a, b) => (b.enrollment?.progressPercent ?? 0) - (a.enrollment?.progressPercent ?? 0)
    ),
    ...learningPathApi.notStartedPaths
  ]);

  interface UpcomingExerciseCard {
    id: string;
    title: string;
    subtitle: string;
    dueLabel: string;
    isOverdue: boolean;
  }

  const upcomingExercises = $derived.by((): UpcomingExerciseCard[] => {
    const statusKeyByStatus: Record<string, string> = {
      'in-progress': 'dashboard.exercise_status_in_progress',
      overdue: 'dashboard.exercise_status_overdue',
      'not-submitted': 'dashboard.exercise_status_not_submitted'
    };

    const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return MOCK_UPCOMING_EXERCISES.map((exercise) => ({
      id: exercise.id,
      title: exercise.title,
      subtitle: `${exercise.course} · ${t.get(statusKeyByStatus[exercise.status])}`,
      dueLabel: formatter.format(new Date(`${exercise.dueDate}T00:00:00`)),
      isOverdue: exercise.status === 'overdue'
    }));
  });

  const standaloneCourses = $derived(
    MOCK_STANDALONE_COURSES.map((course) => ({
      href: getStudentCourseContinuePath(course.id),
      title: course.title,
      description: course.description,
      coverImage: course.coverImage,
      coverGradient: course.coverGradient,
      progressPercent:
        course.lessonCount === 0 ? 0 : Math.round(Math.min(100, (course.lessonsCompleted / course.lessonCount) * 100)),
      lessonCount: course.lessonCount,
      exerciseCount: course.exerciseCount
    }))
  );

  const currentLearningCards = $derived.by(() => {
    const paths = gridPaths.slice(0, 3);
    const courseSlots = Math.max(0, 3 - paths.length);

    return { paths, courses: standaloneCourses.slice(0, courseSlots) };
  });

  const pathLabels = $derived<LearningPathCardLabels>({
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

  const hours = (value: number) => globalThis.Intl.NumberFormat('en', { maximumFractionDigits: 0 }).format(value);

  $effect(() => {
    if (!$profile.id || !$currentOrg.id) return;

    coursesApi.getEnrolledCourses();
    coursesApi.getRecommendedCourses({ limit: 3 });
    if (!learningPathApi.hasLoaded) {
      learningPathApi.listEnrolled();
    }
  });

  function getCourseCompletedItems(course: EnrolledCourse) {
    const exercisesCompleted =
      'exercisesCompleted' in course && typeof course.exercisesCompleted === 'number' ? course.exercisesCompleted : 0;

    return (course.progressRate || 0) + exercisesCompleted;
  }

  function getCourseTotalItems(course: EnrolledCourse) {
    const exercises = 'exerciseCount' in course && typeof course.exerciseCount === 'number' ? course.exerciseCount : 0;

    return (course.lessonCount || 0) + exercises;
  }

  function getHighlightedCourses(courses: EnrolledCourse[]) {
    return [...courses]
      .sort(
        (leftCourse, rightCourse) =>
          getStudentCourseProgressPercent(rightCourse) - getStudentCourseProgressPercent(leftCourse)
      )
      .slice(0, 1);
  }

  function gotoCourse(id: string | undefined) {
    if (!id) return;

    goto(getStudentCourseContinuePath(id));
  }

  function gotoCourseCertificates(id: string | undefined) {
    if (!id) return;

    goto(`/courses/${id}/certificates`);
  }

  function showPublishedPublicCourseLinks(course: EnrolledCourse | null) {
    if (!course || course.type !== 'PUBLIC') {
      return false;
    }

    const publicSlug = typeof course.slug === 'string' ? course.slug : '';

    if (!publicSlug.trim()) {
      return false;
    }

    return !!course.isPublished;
  }

  function openPublicCoursePage(course: EnrolledCourse | null) {
    if (!course?.id || !showPublishedPublicCourseLinks(course)) {
      return;
    }

    const publicSlug = typeof course.slug === 'string' ? course.slug : '';

    openCoursePreview({
      courseId: course.id,
      courseSlug: publicSlug,
      currentOrgDomain: $currentOrgDomain
    });
  }

  async function copyPublicCourseLink(course: EnrolledCourse | null) {
    if (!course || !showPublishedPublicCourseLinks(course)) {
      return;
    }

    const publicSlug = typeof course.slug === 'string' ? course.slug : '';

    await copyPublicCoursePageUrl(publicSlug, $currentOrgDomain);
  }

  function openCoursePreviewModal(course: RecommendedCourses[number]) {
    selectedCourse = course;
    previewOpen = true;
  }

  function explorePathMeta(pathId: string) {
    const mockPath = getMockPathById(pathId);
    const count = mockPath?.courses.length ?? 0;
    const hoursTotal = (mockPath?.courses ?? []).reduce((acc, course) => acc + course.durationHours, 0);

    return `${$t('learningPath.badge.learning_path')} · ${$t('dashboard.explore_courses_hours', {
      count,
      hours: hours(hoursTotal)
    })}`;
  }
</script>

<div class="space-y-6 pb-8">
  <BlurFade delay={0.05} once>
    <section class="ui:border-primary/20 ui:bg-primary/10 rounded border p-4 md:p-6">
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div class="max-w-xl space-y-2">
          <p class="ui:text-primary text-xs font-semibold tracking-[0.18em] uppercase">
            {#if shouldShowCertificateHero}
              {$t('dashboard.get_your_certificate')}
            {:else}
              {$t('dashboard.pick_up_where_you_left_off')}
            {/if}
          </p>
          <h2 class="text-xl font-semibold tracking-tight">
            {#if currentCourse}
              {currentCourse.title}
            {:else}
              {$t('dashboard.learning_awaits_you')}
            {/if}
          </h2>
          {#if currentPathContext}
            <a
              href={currentPathContext.pathHref}
              class="ui:text-muted-foreground inline-flex items-center gap-1 text-xs hover:underline"
            >
              {currentPathContext.pathName} · {$t('dashboard.course_position', {
                course: currentPathContext.courseOrder,
                total: currentPathContext.totalCourses
              })}
              <ArrowRightIcon class="size-3" />
            </a>
          {/if}
        </div>

        <div class="flex shrink-0 flex-wrap items-center gap-2">
          {#if currentCourse && showPublishedPublicCourseLinks(currentCourse)}
            <IconButton
              variant="outline"
              onclick={() => openPublicCoursePage(currentCourse)}
              tooltip={$t('courses.course_card.context_menu.open_public_course')}
              aria-label={$t('courses.course_card.context_menu.open_public_course')}
            >
              <ExternalLinkIcon class="size-4" />
            </IconButton>
            <IconButton
              variant="outline"
              onclick={() => void copyPublicCourseLink(currentCourse)}
              tooltip={$t('courses.course_card.context_menu.copy_course_url')}
              aria-label={$t('courses.course_card.context_menu.copy_course_url')}
            >
              <CopyIcon class="size-4" />
            </IconButton>
          {/if}
          <Button
            variant="outline"
            class="shrink-0"
            onclick={() =>
              currentCourse
                ? shouldShowCertificateHero
                  ? gotoCourseCertificates(currentCourse.id)
                  : gotoCourse(currentCourse.id)
                : goto('/lms/explore')}
          >
            {#if currentCourse}
              {#if shouldShowCertificateHero}
                {$t('dashboard.my_certificate')}
              {:else}
                {$t('dashboard.continue_learning')}
              {/if}
            {:else}
              {$t('dashboard.view_courses')}
            {/if}
          </Button>
        </div>
      </div>
    </section>
  </BlurFade>

  <section class="grid grid-cols-1 gap-4 md:grid-cols-3">
    <div class="ui:transition-colors hover:ui:border-ring flex items-center gap-4 rounded-xl border p-4">
      <div class="ui:bg-primary/10 ui:text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
        <TargetIcon class="size-5" />
      </div>
      <div class="min-w-0">
        <p class="ui:text-muted-foreground text-xs font-medium">{$t('dashboard.progress')}</p>
        <p class="tnum text-2xl font-semibold">{progressPercentage}%</p>
        <p class="ui:text-muted-foreground truncate text-xs">
          {$t('dashboard.items_done', { completed: totalCompleted, total: totalLessons })}
        </p>
      </div>
    </div>

    <div class="ui:border ui:transition-colors hover:ui:border-ring flex items-center gap-4 rounded-xl p-4">
      <div class="ui:bg-primary/10 ui:text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
        <BookOpenIcon class="size-5" />
      </div>
      <div class="min-w-0">
        <p class="ui:text-muted-foreground text-xs font-medium">{$t('dashboard.enrolled')}</p>
        <p class="tnum text-2xl font-semibold">{coursesApi.enrolledCourses.length}</p>
        <p class="ui:text-muted-foreground truncate text-xs">
          {inProgressCourses.length}
          {$t('learningPath.enrollment.in_progress')}
        </p>
      </div>
    </div>

    <div class="ui:transition-colors hover:ui:border-ring flex items-center gap-4 rounded-xl border p-4">
      <div
        class="ui:bg-emerald-500/10 ui:text-emerald-600 flex size-10 shrink-0 items-center justify-center rounded-lg"
      >
        <CheckCircle2Icon class="size-5" />
      </div>
      <div class="min-w-0">
        <p class="ui:text-muted-foreground text-xs font-medium">{$t('dashboard.completed')}</p>
        <p class="tnum text-2xl font-semibold">{completedCourses.length}</p>
        <p class="ui:text-muted-foreground truncate text-xs">
          {completedCourses.length}
          {$t('dashboard.completed')}
        </p>
      </div>
    </div>
  </section>

  <section class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="ui:text-muted-foreground text-sm font-semibold tracking-[0.14em] uppercase">
        {$t('dashboard.currently_learning')}
      </h2>
      <Button variant="outline" size="sm" onclick={() => goto('/lms/mylearning')}>
        {$t('dashboard.view_more')}
        <ArrowRightIcon class="size-3.5" />
      </Button>
    </div>

    {#if learningPathApi.isLoading}
      <div class="ui:text-muted-foreground flex items-center justify-center py-16">
        <Spinner class="size-6" />
      </div>
    {:else if currentLearningCards.paths.length > 0 || currentLearningCards.courses.length > 0}
      <div class="grid grid-cols-1 gap-4 ps-2 sm:grid-cols-2 lg:grid-cols-3">
        {#each currentLearningCards.paths as path}
          <LearningPathCard
            href={`/lms/paths/${path.id}`}
            name={path.name}
            description={path.description}
            coverGradient={path.coverGradient}
            coverImage={path.coverImage}
            courseCount={path.courses.length}
            progressPercent={path.enrollment?.progressPercent ?? 0}
            coursesCompleted={path.enrollment?.coursesCompleted ?? 0}
            certificateEarned={Boolean(path.enrollment?.certificateId)}
            isLMS={true}
            labels={pathLabels}
          />
        {/each}
        {#each currentLearningCards.courses as course}
          <CourseCard
            isLMS
            href={course.href}
            title={course.title}
            description={course.description}
            coverImage={course.coverImage}
            coverGradient={course.coverGradient}
            lessonCount={course.lessonCount}
            exerciseCount={course.exerciseCount}
            progressPercent={course.progressPercent}
            labels={courseCardLabels}
          />
        {/each}
      </div>
    {:else}
      <div class="ui:bg-card rounded border p-4">
        <Empty title={$t('dashboard.no_courses')} description={$t('dashboard.start_course')} icon={BookOpenIcon} />
      </div>
    {/if}
  </section>

  <div class="mt-10 grid items-start gap-6 lg:grid-cols-2">
    <section class="space-y-4">
      <div class="flex h-8 items-start justify-between">
        <h2 class="ui:text-muted-foreground text-sm font-semibold tracking-[0.14em] uppercase">
          {$t('dashboard.upcoming_exercises')}
        </h2>
        <Button variant="outline" size="sm" onclick={() => goto('/lms/exercises')}>
          {$t('dashboard.view_more')}
          <ArrowRightIcon class="size-3.5" />
        </Button>
      </div>

      {#if upcomingExercises.length > 0}
        <div class="ui:bg-card divide-y overflow-hidden rounded border p-5">
          {#each upcomingExercises as exercise (exercise.id)}
            <div class="flex items-center gap-3 py-[11px]">
              <div
                class="ui:flex ui:size-8 ui:shrink-0 ui:items-center ui:justify-center ui:rounded-md {exercise.isOverdue
                  ? 'ui:bg-destructive ui:text-white'
                  : 'ui:bg-primary/[0.08] ui:text-primary'}"
              >
                {#if exercise.isOverdue}
                  <AlertCircleIcon class="custom size-[15px] text-white" />
                {:else}
                  <SquareCheckBig class="custom size-[15px]" />
                {/if}
              </div>
              <div class="min-w-0 flex-1">
                <p class="truncate text-[13.5px] font-medium">{exercise.title}</p>
                <p class="ui:text-muted-foreground mt-px truncate text-xs">{exercise.subtitle}</p>
              </div>
              <span
                class="shrink-0 text-xs whitespace-nowrap {exercise.isOverdue
                  ? 'ui:text-destructive'
                  : 'ui:text-muted-foreground'} tnum">{exercise.dueLabel}</span
              >
            </div>
          {/each}
        </div>
      {:else}
        <div class="ui:bg-card rounded border p-4">
          <Empty
            icon={ClipboardListIcon}
            title={$t('dashboard.no_exercises')}
            description={$t('dashboard.no_exercises_description')}
          />
        </div>
      {/if}
    </section>

    <section class="space-y-4">
      <div class="flex h-8 items-start justify-between">
        <h2 class="ui:text-muted-foreground text-sm font-semibold tracking-[0.14em] uppercase">
          {$t('dashboard.explore_something_new')}
        </h2>
        <Button variant="outline" size="sm" onclick={() => goto('/lms/explore')}>
          {$t('dashboard.view_more')}
          <ArrowRightIcon class="size-3.5" />
        </Button>
      </div>

      <div class="ui:bg-card divide-y overflow-hidden rounded border">
        {#each learningPathApi.explorePaths as path}
          <a href={path.href} class="ui:transition-colors hover:ui:bg-muted/60 flex items-center gap-3 p-3">
            <div
              class="ui:bg-primary ui:text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-md"
            >
              <PathIcon class="size-2" color="white" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium">{path.name}</p>
              <p class="ui:text-muted-foreground truncate text-xs">{explorePathMeta(path.id)}</p>
            </div>
            <span class="ui:font-medium ui:text-primary inline-flex shrink-0 items-center gap-1 text-xs">
              {$t('learningPath.hero.view_path')}
              <ArrowRightIcon class="size-3.5" />
            </span>
          </a>
        {/each}
        {#each coursesApi.recommendedCourses as course}
          <button
            type="button"
            class="hover:ui:bg-muted/60 flex w-full items-center gap-3 p-3 text-left transition-colors"
            onclick={() => openCoursePreviewModal(course)}
          >
            <div class="ui:bg-primary/10 ui:text-primary flex size-8 shrink-0 items-center justify-center rounded-md">
              <BookOpenIcon class="size-4" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium">{course.title}</p>
              <p class="ui:text-muted-foreground truncate text-xs">
                {`${$t('learningPath.badge.course')} · ${$t('dashboard.explore_lessons_count', {
                  count: course.lessonCount
                })}`}
              </p>
            </div>
            <span class="ui:text-primary inline-flex shrink-0 items-center gap-1 text-xs font-medium">
              {$t('course.navItem.landing_page.start_course')}
              <ArrowRightIcon class="size-3.5" />
            </span>
          </button>
        {/each}
        {#if learningPathApi.explorePaths.length === 0 && coursesApi.recommendedCourses.length === 0}
          <div class="p-4">
            <Empty
              icon={BookOpenIcon}
              title={$t('dashboard.no_recommendations')}
              description={$t('dashboard.no_recommendations_description')}
            />
          </div>
        {/if}
      </div>
    </section>
  </div>

  {#if selectedCourse}
    <CoursePreviewModal course={selectedCourse} bind:open={previewOpen} />
  {/if}
</div>
