<script lang="ts">
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { Spinner } from '@cio/ui/base/spinner';
  import { Empty } from '@cio/ui/custom/empty';
  import { Button } from '@cio/ui/base/button';
  import { PathIcon } from '@cio/ui/custom/moving-icons';
  import { t } from '$lib/utils/functions/translations';
  import { learningPathApi } from '../api/learning-path.svelte';
  import { getMockPathById, getCourseProgressList } from '../utils/mock-data';
  import LearningPathHead from '../components/learning-path-head.svelte';
  import PathStepper from '../components/path-stepper.svelte';

  const authPathId = $derived(page.params.id);

  onMount(() => {
    learningPathApi.ensureSelectedPath(authPathId);
  });

  const path = $derived(learningPathApi.getPath(authPathId) ?? getMockPathById(authPathId));

  const totalHours = $derived((path?.courses ?? []).reduce((acc, course) => acc + course.durationHours, 0));
  const courses = $derived(path ? getCourseProgressList(path) : []);
  const coursesCompleted = $derived(courses.filter((course) => course.state === 'COMPLETED').length);
  const progressPercent = $derived(
    path && path.courses.length > 0 ? Math.round((coursesCompleted / path.courses.length) * 100) : 0
  );
  const currentCourse = $derived(courses.find((course) => course.state === 'IN_PROGRESS') ?? null);
  const certificateEarned = $derived(Boolean(path?.enrollment?.certificateId));

  function courseHref(order: number) {
    return `/lms/mylearning`;
  }
</script>

{#if learningPathApi.isLoading && !path}
  <div class="flex min-h-64 items-center justify-center">
    <Spinner />
  </div>
{:else if !path}
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
    name={path.name}
    description={path.description}
    coverGradient={path.coverGradient}
    coverImage={path.coverImage}
    courseCount={path.courses.length}
    {totalHours}
    sequentialUnlock={path.sequentialUnlock}
    certificateEnabled={path.certificateEnabled}
    {progressPercent}
    {coursesCompleted}
    nextCourseTitle={currentCourse?.title}
    enrollHref={`/lms/paths/${path.id}`}
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
    certificateEnabled={path.certificateEnabled}
    certificateTitle={path.certificateTitle}
    {certificateEarned}
  />
{/if}
