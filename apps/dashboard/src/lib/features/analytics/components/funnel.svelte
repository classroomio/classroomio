<script lang="ts">
  import { Spinner } from '@cio/ui/base/spinner';
  import { t } from '$lib/utils/functions/translations';
  import { Empty } from '@cio/ui/custom/empty';
  import TrendingDownIcon from '@lucide/svelte/icons/trending-down';
  import AnalyticsPanelCard from './analytics-panel-card.svelte';
  import type { CourseFunnelData } from '../utils/types';

  interface Props {
    data: CourseFunnelData | null;
    loading?: boolean;
  }

  let { data, loading = false }: Props = $props();

  const stepLabel = (name: string) => $t(`analytics.funnel.step.${name}`);

  const topCount = $derived(data?.steps[0]?.count ?? 0);
</script>

<AnalyticsPanelCard title={$t('analytics.funnel.heading')} description={$t('analytics.funnel.description')}>
  {#snippet children()}
    {#if loading && !data}
      <div class="flex h-32 items-center justify-center">
        <Spinner class="ui:text-muted-foreground size-6" />
      </div>
    {:else if !data || data.steps.length === 0 || topCount === 0}
      <Empty icon={TrendingDownIcon} title={$t('analytics.funnel.empty')} />
    {:else}
      <ol class="space-y-3">
        {#each data.steps as step, index (step.name)}
          <li>
            <div class="mb-1.5 flex items-baseline justify-between">
              <div class="flex items-baseline gap-2">
                <span class="ui:text-muted-foreground text-xs font-medium tabular-nums">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span class="ui:text-foreground text-sm font-medium">{stepLabel(step.name)}</span>
              </div>
              <div class="flex items-baseline gap-2">
                <span class="ui:text-foreground text-sm tabular-nums">{step.count.toLocaleString()}</span>
                {#if step.conversionFromPrev != null}
                  <span class="ui:bg-primary/10 ui:text-primary rounded px-1.5 py-0.5 text-xs font-medium tabular-nums">
                    {Math.round(step.conversionFromPrev * 100)}%
                  </span>
                {/if}
              </div>
            </div>
            <div class="ui:bg-muted h-2 overflow-hidden rounded-full">
              <div
                class="ui:bg-primary h-full rounded-full transition-all"
                style="width: {topCount > 0 ? (step.count / topCount) * 100 : 0}%"
              ></div>
            </div>
          </li>
        {/each}
      </ol>
    {/if}
  {/snippet}
</AnalyticsPanelCard>
