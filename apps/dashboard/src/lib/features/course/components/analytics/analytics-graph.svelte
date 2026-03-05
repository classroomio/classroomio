<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import type { Component } from 'svelte';
  import type { CourseAnalytics } from '$features/course/utils/types';
  import { ScaleTypes } from '@carbon/charts-svelte';
  import { t } from '$lib/utils/functions/translations';
  import '@carbon/charts-svelte/styles.css';

  interface Props {
    courseAnalytics?: CourseAnalytics | null;
  }

  let { courseAnalytics = null }: Props = $props();

  let BarChartSimple: Component | undefined = $state();

  // Transform data for progress distribution chart
  let progressChartData = $derived(
    courseAnalytics?.students
      ? [
          {
            group: $t('analytics.progress_80_plus'),
            value: courseAnalytics.students.filter((s) => s.progressPercentage >= 80).length
          },
          {
            group: $t('analytics.progress_60_79'),
            value: courseAnalytics.students.filter((s) => s.progressPercentage >= 60 && s.progressPercentage < 80)
              .length
          },
          {
            group: $t('analytics.progress_below_60'),
            value: courseAnalytics.students.filter((s) => s.progressPercentage < 60).length
          }
        ]
      : []
  );

  // Transform data for grade distribution chart
  let gradeChartData = $derived(
    courseAnalytics?.students
      ? [
          {
            group: $t('analytics.grade_90_plus'),
            value: courseAnalytics.students.filter((s) => s.averageGrade >= 90).length
          },
          {
            group: $t('analytics.grade_80_89'),
            value: courseAnalytics.students.filter((s) => s.averageGrade >= 80 && s.averageGrade < 90).length
          },
          {
            group: $t('analytics.grade_70_79'),
            value: courseAnalytics.students.filter((s) => s.averageGrade >= 70 && s.averageGrade < 80).length
          },
          {
            group: $t('analytics.grade_below_70'),
            value: courseAnalytics.students.filter((s) => s.averageGrade < 70).length
          }
        ]
      : []
  );

  onMount(async () => {
    if (browser) {
      const charts = await import('@carbon/charts-svelte');
      BarChartSimple = charts.BarChartSimple as unknown as Component;
    }
  });

  // Chart options for progress distribution
  let progressChartOptions = $derived({
    axes: {
      left: {
        mapsTo: 'value',
        title: $t('analytics.number_of_students')
      },
      bottom: {
        mapsTo: 'group',
        scaleType: ScaleTypes.LABELS,
        title: $t('analytics.progress_range')
      }
    },
    height: '300px',
    data: {
      loading: !courseAnalytics
    },
    color: {
      scale: {
        [$t('analytics.progress_80_plus')]: '#10b981',
        [$t('analytics.progress_60_79')]: '#f59e0b',
        [$t('analytics.progress_below_60')]: '#ef4444'
      }
    }
  });

  // Chart options for grade distribution
  let gradeChartOptions = $derived({
    axes: {
      left: {
        mapsTo: 'value',
        title: $t('analytics.number_of_students')
      },
      bottom: {
        mapsTo: 'group',
        scaleType: ScaleTypes.LABELS,
        title: $t('analytics.grade_range')
      }
    },
    height: '300px',
    data: {
      loading: !courseAnalytics
    },
    color: {
      scale: {
        [$t('analytics.grade_90_plus')]: '#10b981',
        [$t('analytics.grade_80_89')]: '#3b82f6',
        [$t('analytics.grade_70_79')]: '#f59e0b',
        [$t('analytics.grade_below_70')]: '#ef4444'
      }
    }
  });
</script>

{#if browser && BarChartSimple}
  <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
    <!-- Progress Distribution Chart -->
    <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800">
      <h3 class="mb-6 text-lg font-semibold text-gray-900 dark:text-white">
        {$t('analytics.student_progress_distribution')}
      </h3>
      {#if courseAnalytics?.students && courseAnalytics.students.length > 0}
        <BarChartSimple data={progressChartData} options={progressChartOptions} />
      {:else}
        <div class="flex h-[300px] items-center justify-center text-gray-500 dark:text-gray-400">
          {$t('analytics.no_progress_data')}
        </div>
      {/if}
    </div>

    <!-- Grade Distribution Chart -->
    <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800">
      <h3 class="mb-6 text-lg font-semibold text-gray-900 dark:text-white">{$t('analytics.grade_distribution')}</h3>
      {#if courseAnalytics?.students && courseAnalytics.students.length > 0}
        <BarChartSimple data={gradeChartData} options={gradeChartOptions} />
      {:else}
        <div class="flex h-[300px] items-center justify-center text-gray-500 dark:text-gray-400">
          {$t('analytics.no_grade_data')}
        </div>
      {/if}
    </div>
  </div>
{:else}
  <!-- Loading state -->
  <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
    <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800">
      <h3 class="mb-6 text-lg font-semibold text-gray-900 dark:text-white">
        {$t('analytics.student_progress_distribution')}
      </h3>
      <div class="flex h-[300px] items-center justify-center">
        <div class="animate-pulse text-gray-500 dark:text-gray-400">{$t('analytics.loading_chart')}</div>
      </div>
    </div>
    <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800">
      <h3 class="mb-6 text-lg font-semibold text-gray-900 dark:text-white">{$t('analytics.grade_distribution')}</h3>
      <div class="flex h-[300px] items-center justify-center">
        <div class="animate-pulse text-gray-500 dark:text-gray-400">{$t('analytics.loading_chart')}</div>
      </div>
    </div>
  </div>
{/if}
