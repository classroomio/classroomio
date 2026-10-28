<script lang="ts">
  import CalendarXIcon from '@lucide/svelte/icons/calendar-x';
  import ChartNoAxesColumnIcon from '@lucide/svelte/icons/chart-no-axes-column';
  import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
  import UsersIcon from '@lucide/svelte/icons/users';
  import { Button } from '@cio/ui/base/button';
  import { Empty } from '@cio/ui/custom/empty';
  import { t } from '$lib/utils/functions/translations';

  import { insightsApi } from '../api';
  import type { WidgetEmptyKind, WidgetEmptyState } from '../utils/types';

  interface Props {
    emptyState: WidgetEmptyState;
  }

  let { emptyState }: Props = $props();

  const ICONS: Record<WidgetEmptyKind, typeof ChartNoAxesColumnIcon> = {
    no_students: UsersIcon,
    waiting: ChartNoAxesColumnIcon,
    positive: CircleCheckIcon,
    range: CalendarXIcon
  };

  const description = $derived(emptyState.descriptionKey ? $t(emptyState.descriptionKey, emptyState.vars) : undefined);
</script>

<Empty icon={ICONS[emptyState.kind]} title={$t(emptyState.titleKey, emptyState.vars)} {description} class="h-[240px]">
  {#if emptyState.kind === 'range'}
    <Button type="button" variant="outline" size="sm" onclick={() => insightsApi.selectRange('all')}>
      {$t('insights.empty_states.show_all_time')}
    </Button>
  {:else if emptyState.action}
    <Button href={emptyState.action.href} variant="outline" size="sm">{$t(emptyState.action.labelKey)}</Button>
  {/if}
</Empty>
