<script lang="ts">
  import ChartNoAxesColumnIcon from '@lucide/svelte/icons/chart-no-axes-column';
  import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
  import MousePointerClickIcon from '@lucide/svelte/icons/mouse-pointer-click';
  import { Button } from '@cio/ui/base/button';
  import { Empty } from '@cio/ui/custom/empty';
  import { cn } from '@cio/ui/tools';
  import { AnalyticsPanelCard } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';

  import { insightsApi } from '../api';
  import { SELF_LOADING_WIDGET_IDS, WIDGET_SPAN_CLASS, resolveWidgetSpec } from '../utils/insights-utils';
  import type { InsightsWidget } from '../utils/types';
  import LearnersTable from './learners/learners-table.svelte';
  import WidgetSkeleton from './widget-skeleton.svelte';
  import { rendererFor } from './widgets';

  interface Props {
    widget: InsightsWidget;
    span: number;
  }

  let { widget, span }: Props = $props();

  const state = $derived(insightsApi.widgetState(widget.id));
  const isSelfLoading = $derived(SELF_LOADING_WIDGET_IDS.has(widget.id));
  const isWaitingForSelection = $derived(!isSelfLoading && resolveWidgetSpec(widget, insightsApi.selection) === null);
  const Renderer = $derived(rendererFor(widget));
  const description = $derived(widget.descriptionKey ? $t(widget.descriptionKey) : undefined);
  const spanClass = $derived(WIDGET_SPAN_CLASS[span] ?? 'lg:col-span-12');
</script>

<AnalyticsPanelCard title={$t(widget.titleKey)} {description} class={cn('col-span-1 min-w-0', spanClass)}>
  {#if isSelfLoading}
    <LearnersTable />
  {:else if isWaitingForSelection}
    <Empty icon={MousePointerClickIcon} title={$t(`insights.hints.${widget.id}`)} class="h-[240px]" />
  {:else if state.failed && !state.result}
    <Empty icon={CircleAlertIcon} title={$t('insights.empty.failed')} class="h-[240px]">
      <Button variant="outline" size="sm" onclick={() => insightsApi.runWidget(widget)}>{$t('insights.retry')}</Button>
    </Empty>
  {:else if !state.result}
    <WidgetSkeleton viz={widget.viz} />
  {:else if state.result.rows.length === 0}
    <Empty icon={ChartNoAxesColumnIcon} title={$t('insights.empty.no_data')} class="h-[240px]" />
  {:else}
    <div class={cn('transition-opacity duration-200', state.loading && 'opacity-60')} aria-busy={state.loading}>
      <Renderer {widget} result={state.result} />
    </div>
  {/if}
</AnalyticsPanelCard>
