<script lang="ts">
  import { Spinner } from '@cio/ui/base/spinner';
  import { Empty } from '@cio/ui/custom/empty';
  import LayersIcon from '@lucide/svelte/icons/layers';
  import { t } from '$lib/utils/functions/translations';
  import AnalyticsPanelCard from './analytics-panel-card.svelte';
  import type { PopularTypesData } from '../utils/types';

  interface Props {
    data: PopularTypesData;
    loading?: boolean;
  }

  let { data, loading = false }: Props = $props();

  const maxEnrollments = $derived(Math.max(1, ...data.map((row) => row.enrollments)));
  const totalEnrollments = $derived(data.reduce((sum, row) => sum + row.enrollments, 0));

  function typeLabel(type: string) {
    return $t(`analytics.popularTypes.types.${type}`, { default: type });
  }
</script>

<AnalyticsPanelCard
  title={$t('analytics.popularTypes.heading')}
  description={data.length > 0
    ? $t('analytics.popularTypes.subtitle', { total: totalEnrollments.toLocaleString() })
    : $t('analytics.popularTypes.description')}
>
  {#snippet children()}
    {#if loading && data.length === 0}
      <div class="flex h-32 items-center justify-center">
        <Spinner class="ui:text-muted-foreground size-6" />
      </div>
    {:else if data.length === 0}
      <Empty icon={LayersIcon} title={$t('analytics.popularTypes.empty')} />
    {:else}
      <ul class="ui:divide-border divide-y">
        {#each data as row (row.type)}
          <li class="relative py-3">
            <div
              class="ui:bg-primary/10 absolute inset-y-1 left-0 rounded-r"
              style="width: {(row.enrollments / maxEnrollments) * 100}%"
              aria-hidden="true"
            ></div>
            <div class="relative flex items-center justify-between gap-3">
              <div class="min-w-0">
                <p class="ui:text-foreground text-sm font-medium">{typeLabel(row.type)}</p>
                <p class="ui:text-muted-foreground text-xs">
                  {$t('analytics.popularTypes.course_count', { count: row.courseCount })}
                </p>
              </div>
              <div class="text-right">
                <p class="ui:text-foreground text-sm font-semibold tabular-nums">
                  {row.enrollments.toLocaleString()}
                </p>
                <p class="ui:text-muted-foreground text-xs tabular-nums">
                  {row.views.toLocaleString()}
                  {$t('analytics.popularTypes.views_short')}
                </p>
              </div>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  {/snippet}
</AnalyticsPanelCard>
