<script lang="ts">
  import { activeBreakdownGroup } from '@cio/utils/analytics';
  import type { TAnalyticsBreakdownGroup } from '@cio/utils/constants/analytics';
  import { RangePicker } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';

  import { analyticsApi } from '../api';

  const available = $derived(analyticsApi.availableBreakdowns);
  const selected = $derived(activeBreakdownGroup(analyticsApi.selection, available));
  const dashboard = $derived(analyticsApi.dashboard);
  const isCourseScope = $derived(dashboard?.scope.type === 'course');
  const cohortCount = $derived(dashboard?.scope.cohortCount ?? 0);
  const courseCount = $derived(dashboard?.scope.courses.length ?? 0);

  const options = $derived.by((): Array<{ value: TAnalyticsBreakdownGroup; label: string }> => {
    if (available.length <= 1) return [];

    return [
      {
        value: 'courses',
        label: isCourseScope
          ? $t('analytics.breakdown.all_students')
          : $t('analytics.breakdown.courses', { count: courseCount })
      },
      {
        value: 'cohorts',
        label: isCourseScope
          ? $t('analytics.breakdown.by_cohort', { count: cohortCount })
          : $t('analytics.breakdown.cohorts', { count: cohortCount })
      }
    ];
  });
</script>

{#if options.length > 1}
  <RangePicker
    value={selected}
    {options}
    label={$t('analytics.breakdown.label')}
    disabled={!dashboard}
    onChange={(breakdown) => void analyticsApi.setBreakdown(breakdown)}
    testId="analytics-breakdown"
  />
{/if}
