<script lang="ts">
  import { goto } from '$app/navigation';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import { Progress } from '@cio/ui/base/progress';
  import { Spinner } from '@cio/ui/base/spinner';
  import { Empty } from '@cio/ui/custom/empty';
  import { BlurFade } from '@cio/ui/custom/animation/blurfade';
  import { ActivityCard } from '$features/ui';
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import ClipboardCheckIcon from '@lucide/svelte/icons/clipboard-check';
  import FlameIcon from '@lucide/svelte/icons/flame';
  import TargetIcon from '@lucide/svelte/icons/target';
  import UserRoundIcon from '@lucide/svelte/icons/user-round';
  import { t } from '$lib/utils/functions/translations';
  import { classroomio } from '$lib/utils/services/api';
  import { currentOrg, currentOrgDomain } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { coursesApi } from '$features/course/api';
  import * as ResourceListRow from '@cio/ui/custom/resource-list-row';
  import { CourseListRow } from '$features/course/components';
  import UpcomingSessionsCard from '$features/lms/components/upcoming-sessions-card.svelte';
  import CoursePublicBadge from '$features/course/components/course-public-badge.svelte';
  import CoursePreviewModal from '$features/lms/components/course-preview-modal.svelte';
  import type { RecommendedCourses } from '$features/course/types';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
  import CopyIcon from '@lucide/svelte/icons/copy';
  import VideoIcon from '@lucide/svelte/icons/video';
  import { copyPublicCoursePageUrl, openCoursePreview } from '$features/course/utils/course-preview';
  import {
    getStudentCourseComplianceDate,
    getStudentCourseComplianceStatusKey,
    getStudentCourseComplianceStatusVariant,
    getStudentCourseProgressPercent,
    isStudentCourseComplete
  } from '$features/course/utils/compliance-utils';
  import { getStudentCourseContinuePath } from '$features/course/utils/student-course-navigation';

  type EnrolledCourse = (typeof coursesApi.enrolledCourses)[number];

  let loginStreak = $state<number | null>(null);
  let hasLoadedLoginStreak = $state(false);
  let selectedCourse = $state<RecommendedCourses[number] | null>(null);
  let previewOpen = $state(false);

  let totalCompleted = $derived(
    coursesApi.enrolledCourses.reduce((acc, course) => acc + getCourseCompletedItems(course), 0)
  );

  let totalLessons = $derived(coursesApi.enrolledCourses.reduce((acc, course) => acc + getCourseTotalItems(course), 0));

  let progressPercentage = $derived(totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0);
  let complianceCourses = $derived(coursesApi.enrolledCourses.filter((course) => course.type === 'COMPLIANCE'));
  let completedComplianceCourses = $derived(complianceCourses.filter((course) => isStudentCourseComplete(course)));
  let complianceScore = $derived(
    complianceCourses.length > 0
      ? Math.round((completedComplianceCourses.length / complianceCourses.length) * 100)
      : null
  );

  let inProgressCourses = $derived(coursesApi.enrolledCourses.filter((course) => !isStudentCourseComplete(course)));
  let highlightedCourses = $derived.by(() => getHighlightedCourses(inProgressCourses));
  let currentCourse = $derived(highlightedCourses[0] ?? coursesApi.enrolledCourses[0] ?? null);
  let shouldShowCertificateHero = $derived.by(() => {
    if (!currentCourse || coursesApi.enrolledCourses.length !== 1) {
      return false;
    }

    return isStudentCourseComplete(currentCourse) && currentCourse.certificateEarnedAt != null;
  });

  let upcomingSessions = $derived(
    coursesApi.enrolledCourses
      .filter((course) => course.type === 'LIVE_CLASS' && course.upcomingSession)
      .map((course) => ({
        lessonId: course.upcomingSession!.lessonId,
        courseTitle: course.title,
        lessonTitle: course.upcomingSession!.lessonTitle,
        callUrl: course.upcomingSession!.callUrl,
        lessonAt: course.upcomingSession!.lessonAt,
        timezone: course.upcomingSession!.sessionTimezone
      }))
      .sort((a, b) => new Date(a.lessonAt).getTime() - new Date(b.lessonAt).getTime())
  );

  $effect(() => {
    if (!$profile.id || !$currentOrg.id) return;

    coursesApi.getEnrolledCourses();
    coursesApi.getRecommendedCourses({ limit: 3 });
  });

  $effect(() => {
    if (!$profile.id || hasLoadedLoginStreak) return;

    hasLoadedLoginStreak = true;
    loadLoginStreak();
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
      .sort((leftCourse, rightCourse) => {
        const leftComplianceDate = getStudentCourseComplianceDate(leftCourse)?.value;
        const rightComplianceDate = getStudentCourseComplianceDate(rightCourse)?.value;

        if (leftComplianceDate || rightComplianceDate) {
          const leftTimestamp = leftComplianceDate ? new Date(leftComplianceDate).getTime() : Number.POSITIVE_INFINITY;
          const rightTimestamp = rightComplianceDate
            ? new Date(rightComplianceDate).getTime()
            : Number.POSITIVE_INFINITY;

          return leftTimestamp - rightTimestamp;
        }

        return getStudentCourseProgressPercent(rightCourse) - getStudentCourseProgressPercent(leftCourse);
      })
      .slice(0, 2);
  }

  async function loadLoginStreak() {
    try {
      const response = await classroomio.dash['login-streak'].$get();
      const result = await response.json();

      if (result.success) {
        loginStreak = result.data.daysActive;
      }
    } catch (error) {
      console.error('Failed to load login streak', error);
      loginStreak = 0;
    }
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
</script>

<div class="space-y-6 pb-8">
  {#if upcomingSessions.length}
    <UpcomingSessionsCard sessions={upcomingSessions} />
  {/if}

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

  <section class="mb-10 flex flex-wrap items-start">
    <div class="grid w-full grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      <BlurFade delay={0.1} once>
        <ActivityCard
          activity={{
            icon: TargetIcon,
            title: $t('dashboard.progress'),
            percentage: progressPercentage,
            description: $t('dashboard.items_done', { completed: totalCompleted, total: totalLessons })
          }}
        />
      </BlurFade>

      <BlurFade delay={0.15} once>
        <ActivityCard
          activity={{
            icon: ClipboardCheckIcon,
            title: $t('dashboard.compliance'),
            percentage: complianceScore ?? '--',
            description: $t('dashboard.compliance_met', {
              completed: completedComplianceCourses.length,
              total: complianceCourses.length
            }),
            hidePercentage: complianceScore === null
          }}
        />
      </BlurFade>

      <BlurFade delay={0.2} once>
        <ActivityCard
          activity={{
            icon: FlameIcon,
            title: $t('dashboard.streak'),
            percentage: loginStreak ?? 0,
            description: $t('dashboard.days_active'),
            hidePercentage: true
          }}
        />
      </BlurFade>
    </div>
  </section>

  <div class="grid items-stretch gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.72fr)]">
    <section class="flex h-full flex-col space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="ui:text-muted-foreground text-sm font-semibold tracking-[0.14em] uppercase">
          {$t('dashboard.currently_learning')}
        </h2>
        <Button variant="outline" size="sm" onclick={() => goto('/lms/mylearning')}>
          {$t('dashboard.view_more')}
        </Button>
      </div>

      <div class="flex flex-1 flex-col space-y-3">
        {#if coursesApi.isLoading}
          <div class="ui:text-muted-foreground flex flex-1 items-center justify-center py-16">
            <Spinner class="size-6" />
          </div>
        {:else if highlightedCourses.length > 0}
          {#each highlightedCourses as course}
            {@const courseProgress = getStudentCourseProgressPercent(course)}
            {@const totalItems = getCourseTotalItems(course)}
            {@const completedItems = getCourseCompletedItems(course)}
            <article class="ui:bg-card ui:text-card-foreground rounded border p-4">
              <div
                class="flex flex-col gap-4 md:flex-row md:items-center lg:flex-col lg:items-stretch xl:flex-row xl:items-center"
              >
                <div class="flex min-w-0 flex-1 items-start gap-4">
                  <div class="ui:bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded">
                    {#if course.logo}
                      <img src={course.logo} alt="" class="size-full rounded object-cover" />
                    {:else}
                      <UserRoundIcon class="ui:text-primary size-5" />
                    {/if}
                  </div>

                  <div class="min-w-0 flex-1">
                    <div class="flex min-w-0 flex-wrap items-center gap-2">
                      <h3 class="truncate text-base font-semibold">{course.title}</h3>
                      {#if course.type === 'PUBLIC'}
                        <CoursePublicBadge class="shrink-0" />
                      {/if}
                    </div>
                    {#if course.description}
                      <p class="ui:text-muted-foreground mt-1 line-clamp-2 text-sm">{course.description}</p>
                    {/if}

                    {#if course.type === 'COMPLIANCE'}
                      {@const complianceStatusKey = getStudentCourseComplianceStatusKey(course)}
                      <div class="mt-3">
                        {#if complianceStatusKey}
                          <Badge variant={getStudentCourseComplianceStatusVariant(course)}>
                            {$t(complianceStatusKey)}
                          </Badge>
                        {/if}
                      </div>
                    {/if}
                  </div>
                </div>

                <div class="flex shrink-0 items-center gap-2">
                  {#if showPublishedPublicCourseLinks(course)}
                    <IconButton
                      variant="outline"
                      onclick={() => openPublicCoursePage(course)}
                      tooltip={$t('courses.course_card.context_menu.open_public_course')}
                      aria-label={$t('courses.course_card.context_menu.open_public_course')}
                    >
                      <ExternalLinkIcon class="size-4" />
                    </IconButton>
                    <IconButton
                      variant="outline"
                      onclick={() => void copyPublicCourseLink(course)}
                      tooltip={$t('courses.course_card.context_menu.copy_course_url')}
                      aria-label={$t('courses.course_card.context_menu.copy_course_url')}
                    >
                      <CopyIcon class="size-4" />
                    </IconButton>
                  {/if}
                  {#if course.type === 'LIVE_CLASS' && course.upcomingSession?.callUrl}
                    <a href={course.upcomingSession.callUrl} target="_blank" rel="noreferrer" class="shrink-0">
                      <Button><VideoIcon class="size-4" />{$t('course.navItem.lessons.session.join')}</Button>
                    </a>
                  {/if}
                  <Button variant="outline" class="shrink-0" onclick={() => gotoCourse(course.id)}>
                    {$t('dashboard.continue')}
                  </Button>
                </div>
              </div>

              <div class="mt-5 flex items-center gap-4">
                <div class="min-w-0 flex-1">
                  <div class="mb-2 flex items-center justify-between text-xs">
                    <span class="ui:text-muted-foreground">
                      {$t('dashboard.items_done', { completed: completedItems, total: totalItems })}
                    </span>
                    <span class="ui:text-muted-foreground">{courseProgress}%</span>
                  </div>
                  <Progress value={courseProgress} max={100} class="ui:h-1.5" />
                </div>
              </div>
            </article>
          {/each}
        {:else}
          <div class="ui:bg-card rounded border p-4">
            <Empty title={$t('dashboard.no_courses')} description={$t('dashboard.start_course')} icon={BookOpenIcon} />
          </div>
        {/if}
      </div>
    </section>

    <section class="flex h-full flex-col space-y-4">
      <h2 class="ui:text-muted-foreground text-sm font-semibold tracking-[0.14em] uppercase">
        {$t('dashboard.compliance')}
      </h2>

      {#if coursesApi.isLoading}
        <div class="ui:text-muted-foreground flex flex-1 items-center justify-center rounded border py-16">
          <Spinner class="size-6" />
        </div>
      {:else}
        <article class="ui:bg-card ui:text-card-foreground flex flex-1 rounded border p-4">
          <div class="flex items-center justify-between gap-4 lg:flex-col lg:items-start xl:flex-row xl:items-center">
            <div class="flex min-w-0 items-center gap-4">
              <div class="ui:bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded">
                <ClipboardCheckIcon class="ui:text-primary size-5" />
              </div>
              <div class="min-w-0">
                <h3 class="font-semibold">{$t('dashboard.compliance_score')}</h3>
                <p class="ui:text-muted-foreground mt-1 text-sm">
                  {#if complianceCourses.length > 0}
                    {$t('dashboard.required_courses_completed', {
                      completed: completedComplianceCourses.length,
                      total: complianceCourses.length
                    })}
                  {:else}
                    {$t('dashboard.compliance_score_empty')}
                  {/if}
                </p>
              </div>
            </div>

            <p class="ui:text-primary shrink-0 text-2xl font-semibold">
              {#if complianceScore === null}
                --
              {:else}
                {complianceScore}%
              {/if}
            </p>
          </div>
        </article>
      {/if}
    </section>
  </div>

  {#if coursesApi.isLoading || coursesApi.recommendedCourses.length > 0}
    <section class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="ui:text-muted-foreground text-sm font-semibold tracking-[0.14em] uppercase">
          {$t('dashboard.explore_more_courses')}
        </h2>
        <Button variant="outline" size="sm" onclick={() => goto('/lms/explore')}>
          {$t('dashboard.view_more')}
        </Button>
      </div>

      {#if coursesApi.isLoading}
        <div class="ui:text-muted-foreground flex items-center justify-center py-8">
          <Spinner class="size-6" />
        </div>
      {:else}
        <ResourceListRow.Group class="@container">
          {#each coursesApi.recommendedCourses as course (course.id)}
            <CourseListRow
              id={course.id}
              slug={course.slug ?? ''}
              title={course.title}
              logo={course.logo}
              type={course.type}
              description={course.description ?? ''}
              isPublished={course.isPublished ?? false}
              lessonCount={course.lessonCount}
              exerciseCount={course.exerciseCount}
              isExplore={true}
              isLMS={true}
              hiddenColumns={['published', 'tags', 'students']}
              onExploreClick={() => {
                selectedCourse = course;
                previewOpen = true;
              }}
            />
          {/each}
        </ResourceListRow.Group>
      {/if}
    </section>
  {/if}

  {#if selectedCourse}
    <CoursePreviewModal course={selectedCourse} bind:open={previewOpen} />
  {/if}
</div>
