<script lang="ts">
  import { goto } from '$app/navigation';
  import { Button } from '@cio/ui/base/button';
  import { Spinner } from '@cio/ui/base/spinner';
  import { Empty } from '@cio/ui/custom/empty';
  import { BlurFade } from '@cio/ui/custom/animation/blurfade';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { LearningPathCard } from '$features/learning-path/components';
  import { CourseCurrentCard } from '$features/learning-path/components';
  import { PathIcon } from '@cio/ui/custom/moving-icons';
  import { learningPathApi } from '$features/learning-path/api/learning-path.svelte';
  import { getMockPathById } from '$features/learning-path/utils/mock-data';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg, currentOrgDomain } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { coursesApi } from '$features/course/api';
  import CoursePreviewModal from '$features/lms/components/course-preview-modal.svelte';
  import type { RecommendedCourses } from '$features/course/types';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import CheckCircle2Icon from '@lucide/svelte/icons/circle-check-big';
  import ClipboardListIcon from '@lucide/svelte/icons/clipboard-list';
  import CopyIcon from '@lucide/svelte/icons/copy';
  import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
  import TargetIcon from '@lucide/svelte/icons/target';
  import { copyPublicCoursePageUrl, openCoursePreview } from '$features/course/utils/course-preview';
  import { getStudentCourseProgressPercent, isStudentCourseComplete } from '$features/course/utils/compliance-utils';
  import { getStudentCourseContinuePath } from '$features/course/utils/student-course-navigation';

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

  const enrolledPathTitles = $derived.by(() => {
    const titles = new Set<string>();

    for (const path of learningPathApi.enrolledPaths) {
      for (const course of learningPathApi.getPathCourses(path)) {
        titles.add(course.title.toLowerCase());
      }
    }

    return titles;
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

    return null;
  });

  const gridPaths = $derived.by(() => [
    ...learningPathApi.inProgressPaths.sort(
      (a, b) => (b.enrollment?.progressPercent ?? 0) - (a.enrollment?.progressPercent ?? 0)
    ),
    ...learningPathApi.notStartedPaths
  ]);

  const standaloneCourses = $derived(
    inProgressCourses.filter((course) => !enrolledPathTitles.has(course.title.toLowerCase()))
  );

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
              {#if shouldShowCertificateHero}
                {currentCourse.title}
              {:else}
                {$t('dashboard.course_awaits_you', { title: currentCourse.title })}
              {/if}
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
    <div
      class="ui:flex ui:items-center ui:gap-4 ui:rounded-xl ui:border ui:p-4 ui:transition-colors hover:ui:border-ring"
    >
      <div
        class="ui:flex ui:size-10 ui:shrink-0 ui:items-center ui:justify-center ui:rounded-lg ui:bg-primary/10 ui:text-primary"
      >
        <TargetIcon class="ui:size-5" />
      </div>
      <div class="ui:min-w-0">
        <p class="ui:text-xs ui:font-medium ui:text-muted-foreground">{$t('dashboard.progress')}</p>
        <p class="tnum ui:text-2xl ui:font-semibold">{progressPercentage}%</p>
        <p class="ui:truncate ui:text-xs ui:text-muted-foreground">
          {$t('dashboard.items_done', { completed: totalCompleted, total: totalLessons })}
        </p>
      </div>
    </div>

    <div
      class="ui:flex ui:items-center ui:gap-4 ui:rounded-xl ui:border ui:p-4 ui:transition-colors hover:ui:border-ring"
    >
      <div
        class="ui:flex ui:size-10 ui:shrink-0 ui:items-center ui:justify-center ui:rounded-lg ui:bg-primary/10 ui:text-primary"
      >
        <BookOpenIcon class="ui:size-5" />
      </div>
      <div class="ui:min-w-0">
        <p class="ui:text-xs ui:font-medium ui:text-muted-foreground">{$t('dashboard.enrolled')}</p>
        <p class="tnum ui:text-2xl ui:font-semibold">{coursesApi.enrolledCourses.length}</p>
        <p class="ui:truncate ui:text-xs ui:text-muted-foreground">
          {inProgressCourses.length}
          {$t('learningPath.enrollment.in_progress')}
        </p>
      </div>
    </div>

    <div
      class="ui:flex ui:items-center ui:gap-4 ui:rounded-xl ui:border ui:p-4 ui:transition-colors hover:ui:border-ring"
    >
      <div
        class="ui:flex ui:size-10 ui:shrink-0 ui:items-center ui:justify-center ui:rounded-lg ui:bg-emerald-500/10 ui:text-emerald-600"
      >
        <CheckCircle2Icon class="ui:size-5" />
      </div>
      <div class="ui:min-w-0">
        <p class="ui:text-xs ui:font-medium ui:text-muted-foreground">{$t('dashboard.completed')}</p>
        <p class="tnum ui:text-2xl ui:font-semibold">{completedCourses.length}</p>
        <p class="ui:truncate ui:text-xs ui:text-muted-foreground">
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
      </Button>
    </div>

    {#if coursesApi.isLoading || learningPathApi.isLoading}
      <div class="ui:text-muted-foreground flex items-center justify-center py-16">
        <Spinner class="size-6" />
      </div>
    {:else if gridPaths.length > 0 || standaloneCourses.length > 0}
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {#each gridPaths as path}
          {@const totalHours = path.courses.reduce((acc, course) => acc + course.durationHours, 0)}
          <LearningPathCard
            href={`/lms/paths/${path.id}`}
            name={path.name}
            description={path.description}
            coverGradient={path.coverGradient}
            courseCount={path.courses.length}
            {totalHours}
            progressPercent={path.enrollment?.progressPercent ?? 0}
            coursesCompleted={path.enrollment?.coursesCompleted ?? 0}
            certificateEarned={Boolean(path.enrollment?.certificateId)}
          />
        {/each}
        {#each standaloneCourses as course}
          {@const courseProgress = getStudentCourseProgressPercent(course)}
          {@const courseDuration =
            'durationHours' in course && typeof course.durationHours === 'number' ? course.durationHours : 0}
          <CourseCurrentCard
            href={getStudentCourseContinuePath(course.id)}
            title={course.title}
            description={course.description ?? ''}
            coverGradient="linear-gradient(135deg, oklch(0.685 0.169 237.323), oklch(0.488 0.243 264.376))"
            progressPercent={courseProgress}
            lessonCount={course.lessonCount}
            lessonsCompleted={course.progressRate || 0}
            durationHours={courseDuration}
          />
        {/each}
      </div>
    {:else}
      <div class="ui:bg-card rounded border p-4">
        <Empty title={$t('dashboard.no_courses')} description={$t('dashboard.start_course')} icon={BookOpenIcon} />
      </div>
    {/if}
  </section>

  <div class="grid items-start gap-6 lg:grid-cols-2">
    <section class="space-y-4">
      <h2 class="ui:text-muted-foreground text-sm font-semibold tracking-[0.14em] uppercase">
        {$t('dashboard.upcoming_assignments')}
      </h2>
      <div class="ui:bg-card rounded border p-4">
        <Empty
          icon={ClipboardListIcon}
          title={$t('dashboard.no_assignments')}
          description={$t('dashboard.no_assignments_description')}
        />
      </div>
    </section>

    <section class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="ui:text-muted-foreground text-sm font-semibold tracking-[0.14em] uppercase">
          {$t('dashboard.explore_something_new')}
        </h2>
        <Button variant="outline" size="sm" onclick={() => goto('/lms/explore')}>
          {$t('dashboard.view_more')}
        </Button>
      </div>

      <div class="ui:bg-card ui:divide-y overflow-hidden rounded border">
        {#each learningPathApi.explorePaths as path}
          <a href={path.href} class="ui:flex ui:items-center ui:gap-3 ui:p-3 ui:transition-colors hover:ui:bg-muted/60">
            <div
              class="ui:flex ui:size-8 ui:shrink-0 ui:items-center ui:justify-center ui:rounded-md ui:bg-primary ui:text-primary-foreground"
            >
              <PathIcon class="ui:size-4" />
            </div>
            <div class="ui:min-w-0 ui:flex-1">
              <p class="ui:truncate ui:text-sm ui:font-medium">{path.name}</p>
              <p class="ui:truncate ui:text-xs ui:text-muted-foreground">{explorePathMeta(path.id)}</p>
            </div>
            <span class="ui:inline-flex ui:shrink-0 ui:items-center ui:gap-1 ui:text-xs ui:font-medium ui:text-primary">
              {$t('learningPath.hero.view_path')}
              <ArrowRightIcon class="ui:size-3.5" />
            </span>
          </a>
        {/each}
        {#each coursesApi.recommendedCourses as course}
          <button
            type="button"
            class="ui:flex ui:w-full ui:items-center ui:gap-3 ui:p-3 ui:text-left ui:transition-colors hover:ui:bg-muted/60"
            onclick={() => openCoursePreviewModal(course)}
          >
            <div
              class="ui:flex ui:size-8 ui:shrink-0 ui:items-center ui:justify-center ui:rounded-md ui:bg-primary/10 ui:text-primary"
            >
              <BookOpenIcon class="ui:size-4" />
            </div>
            <div class="ui:min-w-0 ui:flex-1">
              <p class="ui:truncate ui:text-sm ui:font-medium">{course.title}</p>
              <p class="ui:truncate ui:text-xs ui:text-muted-foreground">
                {`${$t('learningPath.badge.course')} · ${$t('dashboard.explore_lessons_count', {
                  count: course.lessonCount
                })}`}
              </p>
            </div>
            <span class="ui:inline-flex ui:shrink-0 ui:items-center ui:gap-1 ui:text-xs ui:font-medium ui:text-primary">
              {$t('course.navItem.landing_page.start_course')}
              <ArrowRightIcon class="ui:size-3.5" />
            </span>
          </button>
        {/each}
        {#if learningPathApi.explorePaths.length === 0 && coursesApi.recommendedCourses.length === 0}
          <div class="ui:p-4">
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
