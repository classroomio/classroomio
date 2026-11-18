<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { Spinner } from '@cio/ui/base/spinner';
  import { Empty } from '@cio/ui/custom/empty';
  import { Button } from '@cio/ui/base/button';
  import { PathIcon } from '@cio/ui/custom/moving-icons';
  import { t } from '$lib/utils/functions/translations';
  import { getStudentCourseContinuePath } from '$features/course/utils/student-course-navigation';
  import { currentOrg } from '$lib/utils/store/org';
  import { learnerPathStore } from '../api/learning-path.svelte';
  import type { PathJourneyCourse } from '$features/lms/utils/types';
  import LearningPathHead from '../components/learning-path-head.svelte';
  import PathStepper from '../components/path-stepper.svelte';

  const authPathId = $derived(page.params.id);

  let journeyRequestedFor = $state<string | null>(null);
  let catalogRequested = $state(false);

  $effect(() => {
    if (!authPathId) return;

    journeyRequestedFor = authPathId;
    learnerPathStore.ensureSelectedPath(authPathId);
    if ($currentOrg.id) {
      catalogRequested = true;
      learnerPathStore.loadCatalogPaths();
      learnerPathStore.listCertificates();
    }
  });

  const journey = $derived(learnerPathStore.selectedJourney);
  const path = $derived(journey?.path ?? null);

  const loadSettled = $derived(journeyRequestedFor === authPathId && catalogRequested && !learnerPathStore.isLoading);

  const previewPath = $derived(
    journey
      ? null
      : (learnerPathStore.catalogPaths.find((item) => item.id === authPathId || item.publicId === authPathId) ?? null)
  );

  const courses = $derived<PathJourneyCourse[]>(journey?.courses ?? []);
  const coursesCompleted = $derived(journey?.completedCourses ?? 0);
  const courseCount = $derived(journey?.totalCourses ?? 0);
  const progressPercent = $derived(journey?.progress ?? 0);
  const currentCourse = $derived(
    courses.find((course) => course.courseId === journey?.currentCourseId) ??
      courses.find((course) => course.status === 'IN_PROGRESS') ??
      courses.find((course) => course.status === 'NOT_STARTED') ??
      courses[0] ??
      null
  );

  const headCtaHref = $derived.by(() => {
    if (courseCount > 0 && coursesCompleted === courseCount) {
      return '/lms/certificates';
    }
    if (currentCourse) {
      return getStudentCourseContinuePath(currentCourse.courseId, journey?.path.publicId ?? authPathId);
    }
    return `/lms/paths/${authPathId}`;
  });

  function courseHref(position: number) {
    const course = courses.find((c) => c.position === position);
    if (!course) return '/lms/mylearning';

    return getStudentCourseContinuePath(course.courseId, journey?.path.publicId ?? authPathId);
  }

  $effect(() => {
    if (
      loadSettled &&
      learnerPathStore.selectedJourneyLoaded &&
      learnerPathStore.selectedJourneyForbidden &&
      !journey &&
      previewPath
    ) {
      goto('/lms/explore');
    }
  });

  function retryJourney() {
    learnerPathStore.ensureSelectedPath(authPathId);
  }
</script>

{#if !journey && !loadSettled}
  <div class="flex min-h-64 items-center justify-center">
    <Spinner />
  </div>
{:else if previewPath}
  {#if learnerPathStore.selectedJourneyLoaded && !learnerPathStore.selectedJourneyForbidden}
    <Empty
      icon={PathIcon}
      title={$t('learningPath.workspace.load_failed_title')}
      description={$t('learningPath.workspace.load_failed_description')}
    >
      {#snippet children()}
        <Button onclick={retryJourney} disabled={learnerPathStore.isLoading}>
          {$t('certificates.retry')}
        </Button>
      {/snippet}
    </Empty>
  {:else}
    <div class="flex min-h-64 items-center justify-center">
      <Spinner />
    </div>
  {/if}
{:else if !journey}
  <Empty
    icon={PathIcon}
    title={$t('learningPath.empty.path_not_found_title')}
    description={$t('learningPath.empty.path_not_found_description')}
  >
    {#snippet children()}
      <Button href="/lms/mylearning">{$t('learningPath.empty.back_to_paths')}</Button>
    {/snippet}
  </Empty>
{:else}
  <LearningPathHead
    pathId={path.id}
    name={path.name}
    description={path.description ?? ''}
    coverImage={path.coverImage ?? undefined}
    {courseCount}
    totalHours={0}
    sequentialUnlock={path.sequentialUnlock}
    certificateEnabled={journey.certificateEnabled}
    certificateAvailable={journey.certificateAvailable}
    {progressPercent}
    {coursesCompleted}
    nextCourseTitle={currentCourse?.title}
    enrollHref={headCtaHref}
  />

  <div class="mt-8 mb-4 flex items-center justify-between">
    <h2 class="text-base font-semibold">{$t('learningPath.detail.course_heading')}</h2>
    {#if path.sequentialUnlock}
      <span class="ui:text-muted-foreground inline-flex items-center gap-1.5 text-xs">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="size-3.5" aria-hidden="true">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        {$t('learningPath.detail.unlock_hint')}
      </span>
    {/if}
  </div>

  <PathStepper
    {courses}
    {courseHref}
    publicId={journey?.path.publicId ?? authPathId}
    certificateEnabled={journey.certificateEnabled}
    certificateAvailable={journey.certificateAvailable}
    certificateTitle={path.name}
  />
{/if}
