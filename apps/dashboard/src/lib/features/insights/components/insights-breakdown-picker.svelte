<script lang="ts">
  import type { TInsightsBreakdownGroup } from '@cio/utils/constants/insights';
  import { RangePicker } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';

  import { insightsApi } from '../api';
  import { activeBreakdownGroup } from '../utils/insights-utils';

  const available = $derived(insightsApi.availableBreakdowns);
  const selected = $derived(activeBreakdownGroup(insightsApi.selection, available));
  const dashboard = $derived(insightsApi.dashboard);
  const isCourseScope = $derived(dashboard?.scope.type === 'course');
  const cohortCount = $derived(dashboard?.scope.cohortCount ?? 0);
  const courseCount = $derived(dashboard?.scope.courses.length ?? 0);

  const options = $derived.by((): Array<{ value: TInsightsBreakdownGroup; label: string }> => {
    if (available.length <= 1) return [];

    return [
      {
        value: 'courses',
        label: isCourseScope
          ? $t('insights.breakdown.all_students')
          : $t('insights.breakdown.courses', { count: courseCount })
      },
      {
        value: 'cohorts',
        label: isCourseScope
          ? $t('insights.breakdown.by_cohort', { count: cohortCount })
          : $t('insights.breakdown.cohorts', { count: cohortCount })
      }
    ];
  });
</script>

{#if options.length > 1}
  <RangePicker
    value={selected}
    {options}
    label={$t('insights.breakdown.label')}
    disabled={!dashboard}
    onChange={(breakdown) => void insightsApi.setBreakdown(breakdown)}
    testId="insights-breakdown"
  />
{/if}
