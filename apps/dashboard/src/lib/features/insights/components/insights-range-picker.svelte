<script lang="ts">
  import { FREE_PLAN_INSIGHTS_DAYS } from '@cio/utils/constants/insights';
  import { RangePicker } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';
  import { isFreePlan } from '$lib/utils/store/org';
  import { openUpgradeModal } from '$lib/utils/store/upgrade-modal';

  import { insightsApi, insightsStudentSheetApi } from '../api';
  import { rangeOptions } from '../utils/insights-utils';

  const maxDays = $derived($isFreePlan ? FREE_PLAN_INSIGHTS_DAYS : null);
  const options = $derived(rangeOptions($t, maxDays));

  function handleRangeChange(range: typeof insightsApi.selection.range) {
    void insightsApi.selectRange(range);
    void insightsStudentSheetApi.reloadIfOpen();
  }
</script>

<RangePicker
  value={insightsApi.selection.range}
  {options}
  label={$t('analytics.range.label')}
  lockedHint={$t('analytics.range.locked')}
  disabled={!insightsApi.dashboard}
  onChange={handleRangeChange}
  onLocked={openUpgradeModal}
  testId="insights-range"
/>
