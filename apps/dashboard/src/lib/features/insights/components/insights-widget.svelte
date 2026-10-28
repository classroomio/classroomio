<script lang="ts">
  import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
  import MousePointerClickIcon from '@lucide/svelte/icons/mouse-pointer-click';
  import { Button } from '@cio/ui/base/button';
  import { Empty } from '@cio/ui/custom/empty';
  import { cn } from '@cio/ui/tools';
  import { AnalyticsPanelCard } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';

  import { insightsApi } from '../api';
  import {
    isEmptyResult,
    isNowCard,
    missingSelection,
    pagerOwnerId,
    SELF_LOADING_WIDGET_IDS,
    WIDGET_SPAN_CLASS,
    widgetEmptyState,
    widgetNotes,
    widgetTitleVars
  } from '../utils/insights-utils';
  import type { InsightsWidget, InsightsWidgetContext } from '../utils/types';
  import StudentsTable from './students/students-table.svelte';
  import NowTag from './now-tag.svelte';
  import WidgetEmpty from './widget-empty.svelte';
  import WidgetPagination from './widget-pagination.svelte';
  import WidgetSkeleton from './widget-skeleton.svelte';
  import { rendererFor } from './widgets';

  interface Props {
    widget: InsightsWidget;
    span: number;
    context: InsightsWidgetContext;
  }

  let { widget, span, context }: Props = $props();

  const state = $derived(insightsApi.widgetState(widget.id));
  const isSelfLoading = $derived(SELF_LOADING_WIDGET_IDS.has(widget.id));
  const missing = $derived(isSelfLoading ? null : missingSelection(widget, insightsApi.selection));
  const Renderer = $derived(rendererFor(widget));
  const titleVars = $derived(
    insightsApi.dashboard ? widgetTitleVars(insightsApi.dashboard, insightsApi.selection, $t) : undefined
  );
  const pageState = $derived(widget.pageGroup ? insightsApi.pageState(widget.pageGroup) : undefined);
  const isEmpty = $derived(state.result !== null && isEmptyResult(widget, state.result, pageState));
  const notes = $derived(isEmpty ? [] : widgetNotes(widget, state.result, context, $t));
  const spanClass = $derived(WIDGET_SPAN_CLASS[span] ?? 'lg:col-span-12');
  const showNowTag = $derived(isNowCard(widget, insightsApi.selection.range));
  const ownsPager = $derived(
    Boolean(widget.pageGroup) && pagerOwnerId(insightsApi.visibleWidgets, widget.pageGroup ?? '') === widget.id
  );
</script>

{#snippet nowTag()}
  <NowTag />
{/snippet}

<AnalyticsPanelCard
  title={$t(widget.titleKey, titleVars)}
  class={cn('col-span-1 min-w-0', spanClass)}
  action={showNowTag ? nowTag : undefined}
>
  {#if isSelfLoading}
    <StudentsTable />
  {:else if missing}
    <Empty icon={MousePointerClickIcon} title={$t(`insights.hints.${widget.id}`)} class="h-[240px]" />
  {:else if state.failed && !state.result}
    <Empty icon={CircleAlertIcon} title={$t('insights.empty.failed')} class="h-[240px]">
      <Button variant="outline" size="sm" onclick={() => insightsApi.runWidget(widget)}>{$t('insights.retry')}</Button>
    </Empty>
  {:else if !state.result}
    <WidgetSkeleton viz={widget.viz} />
  {:else if isEmptyResult(widget, state.result, pageState)}
    <WidgetEmpty emptyState={widgetEmptyState(widget, context)} />
  {:else}
    <div class={cn('transition-opacity duration-200', state.loading && 'opacity-60')} aria-busy={state.loading}>
      <Renderer {widget} result={state.result} />
    </div>
  {/if}
  {#if ownsPager && widget.pageGroup && state.result}
    <WidgetPagination {widget} pageGroup={widget.pageGroup} result={state.result} {context} />
  {/if}
  {#each notes as note (note)}
    <p class="ui:text-muted-foreground mt-3 text-xs">{note}</p>
  {/each}
</AnalyticsPanelCard>
