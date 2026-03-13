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

  const progressChartConfig = $derived({
    students: {
      label: $t('analytics.number_of_students'),
      color: 'var(--chart-1)'
    }
  } satisfies Chart.ChartConfig);

  const gradeChartConfig = $derived({
    students: {
      label: $t('analytics.number_of_students'),
      color: 'var(--chart-2)'
    }
  } satisfies Chart.ChartConfig);

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

  let progressSeries = $derived([
    {
      key: 'students',
      value: 'value',
      label: progressChartConfig.students.label,
      color: 'var(--color-students)'
    }
  ]);

  let gradeSeries = $derived([
    {
      key: 'students',
      value: 'value',
      label: gradeChartConfig.students.label,
      color: 'var(--color-students)'
    }
  ]);
</script>

<div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
  <!-- Progress Distribution Chart -->
  <div class="">
    <h3 class="mb-6 text-lg font-semibold text-gray-900 dark:text-white">
      {$t('analytics.student_progress_distribution')}
    </h3>
    {#if !courseAnalytics}
      <div class="flex h-[300px] items-center justify-center">
        <div class="animate-pulse text-gray-500 dark:text-gray-400">{$t('analytics.loading_chart')}</div>
      </div>
    {:else if hasStudentData}
      <Chart.ChartContainer class="h-[300px] w-full" config={progressChartConfig}>
        <Chart.BarChart
          data={progressChartData}
          x="group"
          axis="x"
          props={progressChartProps}
          series={progressSeries}
        />
      </Chart.ChartContainer>
    {:else}
      <div class="flex h-[300px] items-center justify-center text-gray-500 dark:text-gray-400">
        {$t('analytics.no_progress_data')}
      </div>
    {/if}
  </div>

  <!-- Grade Distribution Chart -->
  <div class="">
    <h3 class="mb-6 text-lg font-semibold text-gray-900 dark:text-white">{$t('analytics.grade_distribution')}</h3>
    {#if !courseAnalytics}
      <div class="flex h-[300px] items-center justify-center">
        <div class="animate-pulse text-gray-500 dark:text-gray-400">{$t('analytics.loading_chart')}</div>
      </div>
    {:else if hasStudentData}
      <Chart.ChartContainer class="h-[300px] w-full" config={gradeChartConfig}>
        <Chart.BarChart data={gradeChartData} x="group" axis="x" props={gradeChartProps} series={gradeSeries} />
      </Chart.ChartContainer>
    {:else}
      <div class="flex h-[300px] items-center justify-center text-gray-500 dark:text-gray-400">
        {$t('analytics.no_grade_data')}
      </div>
    {/if}
  </div>
</div>
