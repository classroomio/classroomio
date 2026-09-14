<script lang="ts">
  import { learningPathApi } from '../api/learning-path.svelte';
  import CurrentlyLearningHero from '../components/currently-learning-hero.svelte';
  import LearningPathCard from '../components/learning-path-card.svelte';
  import LearningPathRow from '../components/learning-path-row.svelte';
  import LearningPathToolbar from '../components/learning-path-toolbar.svelte';
  import type { LearningPathView, DurationFilter } from '../components/types';
  import ExploreMoreStrip from '../components/explore-more-strip.svelte';
  import { Empty } from '@cio/ui/custom/empty';
  import { Spinner } from '@cio/ui/base/spinner';
  import { PathIcon } from '@cio/ui/custom/moving-icons';
  import { t } from '$lib/utils/functions/translations';
  import { onMount } from 'svelte';
  import type { LearningPathStatus, PathDifficulty } from '../utils/types';

  let status = $state<LearningPathStatus | 'ALL'>('ALL');
  let difficulty = $state<PathDifficulty | 'ALL'>('ALL');
  let duration = $state<DurationFilter | 'ALL'>('ALL');
  let view = $state<LearningPathView>('grid');

  onMount(() => {
    if (!learningPathApi.hasLoaded) {
      learningPathApi.listEnrolled();
    }
  });

  const totalHours = (path: (typeof learningPathApi.enrolledPaths)[number]) =>
    path.courses.reduce((acc, course) => acc + course.durationHours, 0);

  const filtered = $derived(
    learningPathApi.enrolledPaths.filter((path) => {
      if (status !== 'ALL' && path.enrollment?.state !== status) return false;
      if (difficulty !== 'ALL' && path.difficulty !== difficulty) return false;

      const hours = totalHours(path);
      if (duration === 'under-4' && hours >= 4) return false;
      if (duration === '4-10' && (hours < 4 || hours >= 10)) return false;
      if (duration === '10-up' && hours < 10) return false;

      return true;
    })
  );

  const activePath = $derived(learningPathApi.activePath);
  const completionProgress = $derived((path: (typeof learningPathApi.enrolledPaths)[number]) => {
    const enrollment = path.enrollment;
    const done = enrollment?.coursesCompleted ?? 0;
    const total = enrollment?.totalCourses ?? 0;

    return {
      progressPercent: enrollment?.progressPercent ?? 0,
      coursesCompleted: done,
      courseCount: total
    };
  });
</script>

{#if learningPathApi.isLoading && learningPathApi.enrolledPaths.length === 0}
  <div class="flex min-h-64 items-center justify-center">
    <Spinner />
  </div>
{:else if learningPathApi.enrolledPaths.length === 0}
  <Empty icon={PathIcon} title={$t('learningPath.empty.title')} description={$t('learningPath.empty.description')} />
{:else}
  <section>
    {#if activePath}
      <div class="mb-2 flex items-center justify-between">
        <h2 class="text-base font-semibold">{$t('learningPath.my_learning.currently_learning')}</h2>
      </div>
      <CurrentlyLearningHero
        name={activePath.name}
        description={activePath.description}
        coverGradient={activePath.coverGradient}
        courseCount={completionProgress(activePath).courseCount}
        totalHours={totalHours(activePath)}
        progressPercent={completionProgress(activePath).progressPercent}
        coursesCompleted={completionProgress(activePath).coursesCompleted}
        href={`/lms/paths/${activePath.id}`}
      />
    {/if}

    <div class="mt-8 mb-3 flex items-center justify-between">
      <h2 class="text-base font-semibold">{$t('learningPath.my_learning.paths_title')}</h2>
    </div>

    <div class="mb-4">
      <LearningPathToolbar bind:status bind:difficulty bind:duration bind:view />
    </div>

    {#if filtered.length === 0}
      <Empty
        icon={PathIcon}
        title={$t('learningPath.empty.no_results_title')}
        description={$t('learningPath.empty.no_results_description')}
      />
    {:else if view === 'grid'}
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-2">
        {#each filtered as path}
          <LearningPathCard
            href={`/lms/paths/${path.id}`}
            name={path.name}
            description={path.description}
            coverGradient={path.coverGradient}
            courseCount={completionProgress(path).courseCount}
            totalHours={totalHours(path)}
            progressPercent={completionProgress(path).progressPercent}
            coursesCompleted={completionProgress(path).coursesCompleted}
            certificateEarned={Boolean(path.enrollment?.certificateId)}
          />
        {/each}
      </div>
    {:else}
      <div class="flex flex-col gap-3">
        {#each filtered as path}
          <LearningPathRow
            href={`/lms/paths/${path.id}`}
            name={path.name}
            description={path.description}
            coverGradient={path.coverGradient}
            courseCount={completionProgress(path).courseCount}
            totalHours={totalHours(path)}
            progressPercent={completionProgress(path).progressPercent}
            coursesCompleted={completionProgress(path).coursesCompleted}
            certificateEarned={Boolean(path.enrollment?.certificateId)}
          />
        {/each}
      </div>
    {/if}

    <ExploreMoreStrip items={learningPathApi.explorePaths} />
  </section>
{/if}
