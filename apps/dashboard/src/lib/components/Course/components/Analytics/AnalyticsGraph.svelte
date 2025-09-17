<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import type { CourseAnalytics } from '$lib/utils/types/analytics';
  import { ScaleTypes } from '@carbon/charts-svelte';
  import '@carbon/charts-svelte/styles.css';

  export let courseAnalytics: CourseAnalytics | null = null;

  let BarChartSimple: any;

  // Transform data for progress distribution chart
  $: progressChartData = courseAnalytics?.students
    ? [
        {
          group: '80%+ Progress',
          value: courseAnalytics.students.filter((s) => s.progressPercentage >= 80).length
        },
        {
          group: '60-79% Progress',
          value: courseAnalytics.students.filter(
            (s) => s.progressPercentage >= 60 && s.progressPercentage < 80
          ).length
        },
        {
          group: 'Below 60% Progress',
          value: courseAnalytics.students.filter((s) => s.progressPercentage < 60).length
        }
      ]
    : [];

  // Transform data for grade distribution chart
  $: gradeChartData = courseAnalytics?.students
    ? [
        {
          group: '90%+ Grade',
          value: courseAnalytics.students.filter((s) => s.averageGrade >= 90).length
        },
        {
          group: '80-89% Grade',
          value: courseAnalytics.students.filter((s) => s.averageGrade >= 80 && s.averageGrade < 90)
            .length
        },
        {
          group: '70-79% Grade',
          value: courseAnalytics.students.filter((s) => s.averageGrade >= 70 && s.averageGrade < 80)
            .length
        },
        {
          group: 'Below 70% Grade',
          value: courseAnalytics.students.filter((s) => s.averageGrade < 70).length
        }
      ]
    : [];

  onMount(async () => {
    if (browser) {
      const charts = await import('@carbon/charts-svelte');
      BarChartSimple = charts.BarChartSimple;
    }
  });

  // Chart options for progress distribution
  $: progressChartOptions = {
    axes: {
      left: {
        mapsTo: 'value',
        title: 'Number of Students'
      },
      bottom: {
        mapsTo: 'group',
        scaleType: ScaleTypes.LABELS,
        title: 'Progress Range'
      }
    },
    height: '300px',
    data: {
      loading: !courseAnalytics
    },
    color: {
      scale: {
        '80%+ Progress': '#10b981', // green
        '60-79% Progress': '#f59e0b', // yellow
        'Below 60% Progress': '#ef4444' // red
      }
    }
  };

  // Chart options for grade distribution
  $: gradeChartOptions = {
    axes: {
      left: {
        mapsTo: 'value',
        title: 'Number of Students'
      },
      bottom: {
        mapsTo: 'group',
        scaleType: ScaleTypes.LABELS,
        title: 'Grade Range'
      }
    },
    height: '300px',
    data: {
      loading: !courseAnalytics
    },
    color: {
      scale: {
        '90%+ Grade': '#10b981', // green
        '80-89% Grade': '#3b82f6', // blue
        '70-79% Grade': '#f59e0b', // yellow
        'Below 70% Grade': '#ef4444' // red
      }
    }
  };
</script>

{#if browser && BarChartSimple}
  <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
    <!-- Progress Distribution Chart -->
    <div
      class="rounded-lg border border-gray-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800"
    >
      <h3 class="mb-6 text-lg font-semibold text-gray-900 dark:text-white">
        Student Progress Distribution
      </h3>
      {#if courseAnalytics?.students && courseAnalytics.students.length > 0}
        <svelte:component
          this={BarChartSimple}
          data={progressChartData}
          options={progressChartOptions}
        />
      {:else}
        <div class="flex h-[300px] items-center justify-center text-gray-500 dark:text-gray-400">
          No progress data available
        </div>
      {/if}
    </div>

    <!-- Grade Distribution Chart -->
    <div
      class="rounded-lg border border-gray-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800"
    >
      <h3 class="mb-6 text-lg font-semibold text-gray-900 dark:text-white">Grade Distribution</h3>
      {#if courseAnalytics?.students && courseAnalytics.students.length > 0}
        <svelte:component this={BarChartSimple} data={gradeChartData} options={gradeChartOptions} />
      {:else}
        <div class="flex h-[300px] items-center justify-center text-gray-500 dark:text-gray-400">
          No grade data available
        </div>
      {/if}
    </div>
  </div>
{:else}
  <!-- Loading state -->
  <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
    <div
      class="rounded-lg border border-gray-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800"
    >
      <h3 class="mb-6 text-lg font-semibold text-gray-900 dark:text-white">
        Student Progress Distribution
      </h3>
      <div class="flex h-[300px] items-center justify-center">
        <div class="animate-pulse text-gray-500 dark:text-gray-400">Loading chart...</div>
      </div>
    </div>
    <div
      class="rounded-lg border border-gray-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800"
    >
      <h3 class="mb-6 text-lg font-semibold text-gray-900 dark:text-white">Grade Distribution</h3>
      <div class="flex h-[300px] items-center justify-center">
        <div class="animate-pulse text-gray-500 dark:text-gray-400">Loading chart...</div>
      </div>
    </div>
  </div>
{/if}
