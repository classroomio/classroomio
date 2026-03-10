<script lang="ts">
  import * as Chart from '@cio/ui/base/chart';
  import type { CourseAnalytics } from '$features/course/utils/types';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    courseAnalytics?: CourseAnalytics | null;
  }

  type DistributionChartData = {
    group: string;
    value: number;
    color: string;
  };

  let { courseAnalytics = null }: Props = $props();

  const chartConfig: Chart.ChartConfig = {};

  let hasStudentData = $derived(Boolean(courseAnalytics?.students?.length));

  // Transform data for progress distribution chart
  let progressChartData = $derived<DistributionChartData[]>(
    courseAnalytics?.students
      ? [
          {
            group: $t('analytics.progress_80_plus'),
            value: courseAnalytics.students.filter((s) => s.progressPercentage >= 80).length,
            color: '#10b981'
          },
          {
            group: $t('analytics.progress_60_79'),
            value: courseAnalytics.students.filter((s) => s.progressPercentage >= 60 && s.progressPercentage < 80)
              .length,
            color: '#f59e0b'
          },
          {
            group: $t('analytics.progress_below_60'),
            value: courseAnalytics.students.filter((s) => s.progressPercentage < 60).length,
            color: '#ef4444'
          }
        ]
      : []
  );

  // Transform data for grade distribution chart
  let gradeChartData = $derived<DistributionChartData[]>(
    courseAnalytics?.students
      ? [
          {
            group: $t('analytics.grade_90_plus'),
            value: courseAnalytics.students.filter((s) => s.averageGrade >= 90).length,
            color: '#10b981'
          },
          {
            group: $t('analytics.grade_80_89'),
            value: courseAnalytics.students.filter((s) => s.averageGrade >= 80 && s.averageGrade < 90).length,
            color: '#3b82f6'
          },
          {
            group: $t('analytics.grade_70_79'),
            value: courseAnalytics.students.filter((s) => s.averageGrade >= 70 && s.averageGrade < 80).length,
            color: '#f59e0b'
          },
          {
            group: $t('analytics.grade_below_70'),
            value: courseAnalytics.students.filter((s) => s.averageGrade < 70).length,
            color: '#ef4444'
          }
        ]
      : []
  );

  let progressChartProps = $derived({
    xAxis: {
      label: $t('analytics.progress_range')
    },
    yAxis: {
      label: $t('analytics.number_of_students')
    }
  });

  let gradeChartProps = $derived({
    xAxis: {
      label: $t('analytics.grade_range')
    },
    yAxis: {
      label: $t('analytics.number_of_students')
    }
  });

  let progressChartColors = $derived({
    domain: progressChartData.map((item) => item.group),
    range: progressChartData.map((item) => item.color)
  });

  let gradeChartColors = $derived({
    domain: gradeChartData.map((item) => item.group),
    range: gradeChartData.map((item) => item.color)
  });
</script>

<div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
  <!-- Progress Distribution Chart -->
  <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800">
    <h3 class="mb-6 text-lg font-semibold text-gray-900 dark:text-white">
      {$t('analytics.student_progress_distribution')}
    </h3>
    {#if !courseAnalytics}
      <div class="flex h-[300px] items-center justify-center">
        <div class="animate-pulse text-gray-500 dark:text-gray-400">{$t('analytics.loading_chart')}</div>
      </div>
    {:else if hasStudentData}
      <Chart.ChartContainer class="h-[300px] w-full" config={chartConfig}>
        <Chart.BarChart
          data={progressChartData}
          x="group"
          y="value"
          c="group"
          cDomain={progressChartColors.domain}
          cRange={progressChartColors.range}
          props={progressChartProps}
        />
      </Chart.ChartContainer>
    {:else}
      <div class="flex h-[300px] items-center justify-center text-gray-500 dark:text-gray-400">
        {$t('analytics.no_progress_data')}
      </div>
    {/if}
  </div>

  <!-- Grade Distribution Chart -->
  <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800">
    <h3 class="mb-6 text-lg font-semibold text-gray-900 dark:text-white">{$t('analytics.grade_distribution')}</h3>
    {#if !courseAnalytics}
      <div class="flex h-[300px] items-center justify-center">
        <div class="animate-pulse text-gray-500 dark:text-gray-400">{$t('analytics.loading_chart')}</div>
      </div>
    {:else if hasStudentData}
      <Chart.ChartContainer class="h-[300px] w-full" config={chartConfig}>
        <Chart.BarChart
          data={gradeChartData}
          x="group"
          y="value"
          c="group"
          cDomain={gradeChartColors.domain}
          cRange={gradeChartColors.range}
          props={gradeChartProps}
        />
      </Chart.ChartContainer>
    {:else}
      <div class="flex h-[300px] items-center justify-center text-gray-500 dark:text-gray-400">
        {$t('analytics.no_grade_data')}
      </div>
    {/if}
  </div>
</div>
