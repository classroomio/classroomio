<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';
  import { t } from '$lib/utils/functions/translations';
  import type { TInsightsStatus } from '@cio/utils/constants/insights';

  import { STATUS_BADGE_VARIANT } from '../utils/insights-utils';

  interface Props {
    status: TInsightsStatus;
  }

  let { status }: Props = $props();
</script>

<Badge variant={STATUS_BADGE_VARIANT[status]}>{$t(`insights.status.${status}`)}</Badge>
