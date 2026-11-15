<script lang="ts">
  import ChartNoAxesColumnIcon from '@lucide/svelte/icons/chart-no-axes-column';
  import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
  import MousePointerClickIcon from '@lucide/svelte/icons/mouse-pointer-click';
  import { missingSelection, widgetUsesPlaceholder } from '@cio/utils/analytics';
  import { Button } from '@cio/ui/base/button';
  import { Empty } from '@cio/ui/custom/empty';
  import { cn } from '@cio/ui/tools';
  import { StatsPanelCard } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';

  import { analyticsApi } from '../api';
  import {
    isEmptyResult,
    isNowCard,
    pagerOwnerId,
    SELF_LOADING_WIDGET_IDS,
    WIDGET_SPAN_CLASS,
    widgetEmptyState,
    widgetNotes,
    widgetTitle
  } from '../utils/analytics-utils';
  import type { AnalyticsWidget, AnalyticsWidgetContext } from '../utils/types';
  import ExercisePicker from './exercise-picker.svelte';
  import StudentsTable from './students/students-table.svelte';
  import NowTag from './now-tag.svelte';
  import WidgetEmpty from './widget-empty.svelte';
  import WidgetPagination from './widget-pagination.svelte';
  import WidgetSkeleton from './widget-skeleton.svelte';
  import { rendererFor } from './widgets';

  interface Props {
    widget: AnalyticsWidget;
    span: number;
    context: AnalyticsWidgetContext;
  }

  let { widget, span, context }: Props = $props();

  const state = $derived(analyticsApi.widgetState(widget.id));
  const isSelfLoading = $derived(SELF_LOADING_WIDGET_IDS.has(widget.id));
  const missing = $derived(isSelfLoading ? null : missingSelection(widget, analyticsApi.selection));
  const Renderer = $derived(rendererFor(widget));
  const title = $derived(widgetTitle(widget, analyticsApi.dashboard, analyticsApi.selection, $t));
  const pageState = $derived(widget.pageGroup ? analyticsApi.pageState(widget.pageGroup) : undefined);
  const isEmpty = $derived(state.result !== null && isEmptyResult(widget, state.result, pageState));
  const notes = $derived(isEmpty ? [] : widgetNotes(widget, state.result, context, $t));
  const spanClass = $derived(WIDGET_SPAN_CLASS[span] ?? 'lg:col-span-12');
  const showNowTag = $derived(isNowCard(widget, analyticsApi.selection.range));
  const ownsPager = $derived(
    Boolean(widget.pageGroup) && pagerOwnerId(analyticsApi.visibleWidgets, widget.pageGroup ?? '') === widget.id
  );
  const pickerCourseId = $derived(
    analyticsApi.selection.courseId ?? analyticsApi.dashboard?.scope.courses[0]?.id ?? null
  );
  const exercises = $derived.by(() => {
    const items = pickerCourseId ? analyticsApi.dashboard?.structures[pickerCourseId]?.items : [];

    return (items ?? []).filter((item) => item.type === 'EXERCISE');
  });
  const showExercisePicker = $derived(widgetUsesPlaceholder(widget, 'exercise') && exercises.length > 0);
</script>

{#snippet nowTag()}
  <NowTag />
{/snippet}

<StatsPanelCard {title} class={cn('col-span-1 min-w-0', spanClass)} action={showNowTag ? nowTag : undefined}>
  {#if showExercisePicker}
    <div class="mb-3 flex justify-end">
      <ExercisePicker
        {exercises}
        value={analyticsApi.selection.exerciseId}
        onChange={(id) => analyticsApi.selectExercise(id)}
      />
    </div>
  {/if}
  {#if isSelfLoading}
    <StudentsTable />
  {:else if missing}
    {#if widgetUsesPlaceholder(widget, 'exercise') && exercises.length === 0}
      <Empty
        icon={ChartNoAxesColumnIcon}
        title={$t('analytics.empty.no_exercises')}
        description={$t('analytics.empty.no_exercises_description')}
        class="h-[240px]"
      />
    {:else}
      <Empty icon={MousePointerClickIcon} title={$t(`analytics.hints.${widget.id}`)} class="h-[240px]" />
    {/if}
  {:else if state.failed && !state.result}
    <Empty icon={CircleAlertIcon} title={$t('analytics.empty.failed')} class="h-[240px]">
      <Button variant="outline" size="sm" onclick={() => analyticsApi.runWidget(widget)}>{$t('analytics.retry')}</Button
      >
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
</StatsPanelCard>
