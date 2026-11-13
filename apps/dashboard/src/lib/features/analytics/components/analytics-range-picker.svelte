<script lang="ts">
  import { FREE_PLAN_ANALYTICS_DAYS } from '@cio/utils/constants/analytics';
  import { RangePicker } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';
  import { isFreePlan } from '$lib/utils/store/org';
  import { openUpgradeModal } from '$lib/utils/store/upgrade-modal';

  import { analyticsApi, analyticsStudentSheetApi } from '../api';
  import { rangeOptions } from '../utils/analytics-utils';

  const maxDays = $derived($isFreePlan ? FREE_PLAN_ANALYTICS_DAYS : null);
  const options = $derived(rangeOptions($t, maxDays));

  function handleRangeChange(range: typeof analyticsApi.selection.range) {
    void analyticsApi.selectRange(range);
    void analyticsStudentSheetApi.reloadIfOpen();
  }
</script>

<RangePicker
  value={analyticsApi.selection.range}
  {options}
  label={$t('common.range.label')}
  lockedHint={$t('common.range.locked')}
  disabled={!analyticsApi.dashboard}
  onChange={handleRangeChange}
  onLocked={openUpgradeModal}
  testId="analytics-range"
/>
