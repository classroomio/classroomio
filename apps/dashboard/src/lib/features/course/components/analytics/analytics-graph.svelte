<script module lang="ts">
  function loadChart() {
    if (typeof window === 'undefined') return Promise.reject(new Error('browser-only'));
    return import('@cio/ui/base/chart');
  }
</script>

<script lang="ts">
  import { browser } from '$app/environment';
  import type { ChartConfig } from '@cio/ui/base/chart/types';
  import { Spinner } from '@cio/ui/base/spinner';
  import { Empty } from '@cio/ui/custom/empty';
  import BarChartIcon from '@lucide/svelte/icons/bar-chart-3';
  import { AnalyticsPanelCard } from '$features/analytics';
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
  } satisfies ChartConfig);

  const gradeChartConfig = $derived({
    students: {
      label: $t('analytics.number_of_students'),
      color: 'var(--chart-2)'
    }
  } satisfies ChartConfig);

  const hasStudentData = $derived(Boolean(courseAnalytics?.students?.length));

  const progressChartData = $derived<DistributionChartData[]>(
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

  const gradeChartData = $derived<DistributionChartData[]>(
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

  const progressChartProps = $derived({
    xAxis: {
      label: $t('analytics.progress_range')
    },
    yAxis: {
      label: $t('analytics.number_of_students')
    }
  });

  const gradeChartProps = $derived({
    xAxis: {
      label: $t('analytics.grade_range')
    },
    yAxis: {
      label: $t('analytics.number_of_students')
    }
  });

  const progressSeries = $derived([
    {
      key: 'students',
      value: 'value',
      label: progressChartConfig.students.label,
      color: 'var(--color-students)'
    }
  ]);

  const gradeSeries = $derived([
    {
      key: 'students',
      value: 'value',
      label: gradeChartConfig.students.label,
      color: 'var(--color-students)'
    }
  ]);

  const chartsLoading = $derived(!courseAnalytics);
</script>

<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
  <AnalyticsPanelCard
    title={$t('analytics.student_progress_distribution')}
    description={$t('analytics.course_metrics.progress_distribution_card_description')}
  >
    {#snippet children()}
      {#if chartsLoading}
        <div class="flex h-[280px] items-center justify-center">
          <Spinner class="ui:text-muted-foreground size-6" />
        </div>
      {:else if browser && hasStudentData}
        {#await loadChart() then C}
          <C.ChartContainer class="h-[280px] w-full" config={progressChartConfig}>
            <C.BarChart
              data={progressChartData}
              x="group"
              axis="x"
              props={progressChartProps}
              series={progressSeries}
            />
          </C.ChartContainer>
        {/await}
      {:else if hasStudentData}
        <div class="flex h-[280px] items-center justify-center">
          <Spinner class="ui:text-muted-foreground size-6" />
        </div>
      {:else}
        <Empty icon={BarChartIcon} title={$t('analytics.no_progress_data')} class="h-[280px]" />
      {/if}
    {/snippet}
  </AnalyticsPanelCard>

  <AnalyticsPanelCard
    title={$t('analytics.grade_distribution')}
    description={$t('analytics.course_metrics.grade_distribution_card_description')}
  >
    {#snippet children()}
      {#if chartsLoading}
        <div class="flex h-[280px] items-center justify-center">
          <Spinner class="ui:text-muted-foreground size-6" />
        </div>
      {:else if browser && hasStudentData}
        {#await loadChart() then C}
          <C.ChartContainer class="h-[280px] w-full" config={gradeChartConfig}>
            <C.BarChart data={gradeChartData} x="group" axis="x" props={gradeChartProps} series={gradeSeries} />
          </C.ChartContainer>
        {/await}
      {:else if hasStudentData}
        <div class="flex h-[280px] items-center justify-center">
          <Spinner class="ui:text-muted-foreground size-6" />
        </div>
      {:else}
        <Empty icon={BarChartIcon} title={$t('analytics.no_grade_data')} class="h-[280px]" />
      {/if}
    {/snippet}
  </AnalyticsPanelCard>
</div>
