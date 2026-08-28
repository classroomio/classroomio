<script lang="ts">
  import { Spinner } from '@cio/ui/base/spinner';
  import { t } from '$lib/utils/functions/translations';
  import { Empty } from '@cio/ui/custom/empty';
  import GlobeIcon from '@lucide/svelte/icons/globe';
  import AnalyticsPanelCard from './analytics-panel-card.svelte';
  import type { CountryBreakdownData } from '../utils/types';

  interface Props {
    data: CountryBreakdownData;
    loading?: boolean;
  }

  let { data, loading = false }: Props = $props();

  const maxViews = $derived(Math.max(1, ...data.map((row) => row.views)));
  const totalViews = $derived(data.reduce((sum, row) => sum + row.views, 0));
</script>

<AnalyticsPanelCard
  title={$t('analytics.countries.heading')}
  description={data.length > 0 ? $t('analytics.countries.subtitle', { total: totalViews.toLocaleString() }) : undefined}
>
  {#snippet children()}
    {#if loading && data.length === 0}
      <div class="flex h-32 items-center justify-center">
        <Spinner class="ui:text-muted-foreground size-6" />
      </div>
    {:else if data.length === 0}
      <Empty icon={GlobeIcon} title={$t('analytics.countries.empty')} />
    {:else}
      <div class="ui:text-muted-foreground mb-2 flex justify-between text-xs font-medium tracking-wide uppercase">
        <span>{$t('analytics.countries.country')}</span>
        <span>{$t('analytics.countries.visitors')}</span>
      </div>
      <ul class="ui:divide-border divide-y">
        {#each data.slice(0, 10) as row (row.country)}
          <li class="relative py-2.5">
            <div
              class="ui:bg-primary/10 absolute inset-y-1 left-0 rounded-r"
              style="width: {(row.views / maxViews) * 100}%"
              aria-hidden="true"
            ></div>
            <div class="relative flex items-center justify-between text-sm">
              <span class="ui:text-foreground font-medium">{row.country}</span>
              <div class="flex items-center gap-3">
                <span class="ui:text-muted-foreground tabular-nums">
                  {row.enrollments.toLocaleString()}
                  {$t('analytics.countries.enrollments_short')}
                </span>
                <span class="ui:text-foreground tabular-nums">{row.views.toLocaleString()}</span>
              </div>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  {/snippet}
</AnalyticsPanelCard>
