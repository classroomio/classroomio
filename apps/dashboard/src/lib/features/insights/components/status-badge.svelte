<script lang="ts">
  import type { TInsightsStatus } from '@cio/utils/constants/insights';
  import { t } from '$lib/utils/functions/translations';

  import { STATUS_PILL_TONE } from '../utils/insights-utils';
  import InsightsPill from './insights-pill.svelte';

  interface Props {
    status: TInsightsStatus;
  }

  let { status }: Props = $props();
</script>

<InsightsPill tone={STATUS_PILL_TONE[status]}>{$t(`insights.status.${status}`)}</InsightsPill>
