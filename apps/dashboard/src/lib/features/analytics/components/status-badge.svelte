<script lang="ts">
  import type { TAnalyticsStatus } from '@cio/utils/constants/analytics';
  import { t } from '$lib/utils/functions/translations';

  import { STATUS_PILL_TONE } from '../utils/analytics-utils';
  import AnalyticsPill from './analytics-pill.svelte';

  interface Props {
    status: TAnalyticsStatus;
  }

  let { status }: Props = $props();
</script>

<AnalyticsPill tone={STATUS_PILL_TONE[status]}>{$t(`analytics.status.${status}`)}</AnalyticsPill>
