<script lang="ts">
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import TableIcon from '@lucide/svelte/icons/table';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import { tick } from 'svelte';
  import { Button } from '../../base/button';
  import { Input } from '../../base/input';
  import * as Tabs from '../../base/tabs';
  import * as Tooltip from '../../base/tooltip';
  import { cn } from '../../tools';
  import { IconButton } from '../icon-button';
  import { NumberField } from '../number-field';
  import InlineText from './block-inline-text.svelte';
  import {
    CHART_TYPES,
    chartColor,
    chartPeak,
    chartPercent,
    chartScale,
    chartTotal,
    emptyRing,
    formatChartValue,
    isRadialChart,
    linePaths,
    linePoints,
    radialSlices
  } from './chart-utils';
  import type { ChartBlockLabels, ChartBlockPoint, ChartBlockType } from './types';

  interface Props {
    title: string;
    type: ChartBlockType;
    points: ChartBlockPoint[];
    editable?: boolean;
    maxPoints?: number;
    maxValue?: number;
    titleMaxLength?: number;
    labelMaxLength?: number;
    labels: ChartBlockLabels;
    testId?: string;
    onTitleInput?: (title: string) => void;
    onTypeChange?: (type: ChartBlockType) => void;
    onPointLabelInput?: (pointId: string, label: string) => void;
    onPointValueInput?: (pointId: string, value: number) => void;
    onAddPoint?: () => void;
    onRemovePoint?: (pointId: string) => void;
  }

  let {
    title,
    type,
    points,
    editable = false,
    maxPoints = 12,
    maxValue,
    titleMaxLength,
    labelMaxLength,
    labels,
    testId,
    onTitleInput,
    onTypeChange,
    onPointLabelInput,
    onPointValueInput,
    onAddPoint,
    onRemovePoint
  }: Props = $props();

  const uid = $props.id();
  const gradientId = `chart-fill-${uid}`;

  let dataOpen = $state(false);
  let inView = $state(false);
  let highlighted = $state<number | null>(null);
  let dataPanel = $state<HTMLElement | null>(null);

  const values = $derived(points.map((point) => point.value));
  const radial = $derived(isRadialChart(type));
  const total = $derived(chartTotal(points));
  const peak = $derived(chartPeak(points));
  const scale = $derived(chartScale(values));
  const axisWidth = $derived(Math.max(...scale.ticks.map((tickValue) => formatChartValue(tickValue).length)));
  const plotted = $derived(linePoints(values, scale.top));
  const paths = $derived(linePaths(plotted));
  const slices = $derived(radialSlices(values, type === 'donut'));
  const ring = $derived(emptyRing(type === 'donut'));
  const canAddPoint = $derived(points.length < maxPoints);
  const canRemovePoint = $derived(points.length > 1);

  const CHART_TYPE_ICONS: Record<ChartBlockType, string> = {
    bar: 'M3 3v18h18 M8 17v-5 M13 17V7 M18 17v-3',
    line: 'M3 3v18h18 M7 15l4-5 3 3 5-6',
    pie: 'M21.21 15.89A10 10 0 1 1 8 2.83 M22 12A10 10 0 0 0 12 2v10z',
    donut: ''
  };

  /** Starts the entrance animation the first time the chart scrolls into view. */
  function revealOnScroll(element: HTMLElement) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;

        inView = true;
        observer.disconnect();
      },
      { threshold: 0.2 }
    );
    observer.observe(element);

    return () => observer.disconnect();
  }

  function isChartType(value: string): value is ChartBlockType {
    return CHART_TYPES.some((chartType) => chartType === value);
  }

  function selectType(nextType: string) {
    if (nextType === type || !isChartType(nextType)) return;

    highlighted = null;
    onTypeChange?.(nextType);
  }

  async function addPoint() {
    const knownIds = new Set(points.map((point) => point.id));
    onAddPoint?.();
    await tick();

    const added = points.find((point) => !knownIds.has(point.id));
    const labelInput = added ? dataPanel?.querySelector<HTMLInputElement>(`[data-point-id="${added.id}"] input`) : null;
    labelInput?.focus();
    labelInput?.select();
  }

  function handleValueChange(pointId: string, value: number | null) {
    onPointValueInput?.(pointId, value ?? 0);
  }
</script>

{#snippet typeIcon(chartType: ChartBlockType)}
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="ui:size-4"
    aria-hidden="true"
  >
    {#if chartType === 'donut'}
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3.5" />
    {:else}
      <path d={CHART_TYPE_ICONS[chartType]} />
    {/if}
  </svg>
{/snippet}

{#snippet axisChart(isLine: boolean)}
  <div class="chart-axis-grid" style:--axis-width={axisWidth}>
    <div class="chart-y-axis" aria-hidden="true">
      {#each scale.ticks as tickValue, index (index)}
        <span style:--position={index * 25}>{formatChartValue(tickValue)}</span>
      {/each}
    </div>
    <div class="chart-plot">
      <div class="chart-gridlines" aria-hidden="true">
        {#each scale.ticks as _, index (index)}
          <i style:--position={index * 25}></i>
        {/each}
      </div>
      {#if isLine}
        <svg class="chart-line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style="stop-color: var(--primary); stop-opacity: 0.24" />
              <stop offset="1" style="stop-color: var(--primary); stop-opacity: 0" />
            </linearGradient>
          </defs>
          <path d={paths.area} fill={`url(#${gradientId})`} />
          <path class="chart-line-path" d={paths.line} />
        </svg>
        {#each plotted as point, index (points[index].id)}
          <span class="chart-dot" style:left="{point.x}%" style:bottom="{100 - point.y}%" style:--index={index}>
            <em>{formatChartValue(values[index])}</em>
          </span>
        {/each}
      {:else}
        <div class="chart-columns">
          {#each points as point, index (point.id)}
            <div class="chart-column" style:--index={index}>
              <span class="chart-value">{formatChartValue(point.value)}</span>
              <div class="chart-bar" style:height="{(point.value / scale.top) * 100}%"></div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
    <div class="chart-x-labels">
      {#each points as point (point.id)}
        <span title={point.label}>{point.label}</span>
      {/each}
    </div>
  </div>
{/snippet}

{#snippet radialChart()}
  <div class="chart-radial">
    <div class="chart-pie">
      <svg viewBox="0 0 100 100" aria-hidden="true">
        {#if slices.length === 0}
          <circle class="chart-empty-ring" cx="50" cy="50" r={ring.radius} style:stroke-width={ring.width} />
        {:else}
          {#each slices as slice (points[slice.index].id)}
            <path
              class="chart-slice"
              class:dim={highlighted !== null && highlighted !== slice.index}
              d={slice.path}
              style:fill={chartColor(type, slice.index)}
              style:--index={slice.index}
              role="presentation"
              onmouseenter={() => (highlighted = slice.index)}
              onmouseleave={() => (highlighted = null)}
            />
          {/each}
        {/if}
      </svg>
      {#if type === 'donut'}
        <div class="chart-pie-center">
          <strong>{formatChartValue(total)}</strong>
          <span>{labels.total}</span>
        </div>
      {/if}
    </div>
    <ul class="chart-legend">
      {#each points as point, index (point.id)}
        <li
          class:dim={highlighted !== null && highlighted !== index}
          onmouseenter={() => (highlighted = index)}
          onmouseleave={() => (highlighted = null)}
        >
          <span class="chart-swatch" style:--color={chartColor(type, index)}></span>
          <span class="chart-legend-name">{point.label}</span>
          <span class="chart-legend-value">{formatChartValue(point.value)}</span>
          <span class="chart-legend-percent">{chartPercent(point.value, total)}%</span>
        </li>
      {/each}
    </ul>
  </div>
{/snippet}

{#snippet canvas()}
  <div class="chart-canvas" class:in-view={inView} {@attach revealOnScroll}>
    {#key type}
      {#if radial}
        {@render radialChart()}
      {:else}
        {@render axisChart(type === 'line')}
      {/if}
    {/key}
  </div>
{/snippet}

{#snippet body()}
  <div class="ui:flex ui:flex-wrap ui:items-start ui:justify-between ui:gap-3.5">
    <div class="ui:flex ui:min-w-[180px] ui:flex-1 ui:flex-col ui:gap-1">
      <InlineText
        tag="h3"
        value={title}
        {editable}
        placeholder={labels.titlePlaceholder}
        ariaLabel={labels.title}
        maxLength={titleMaxLength}
        class={cn(
          'ui:m-0 ui:text-[19px] ui:leading-snug ui:font-bold ui:tracking-[-.02em]',
          editable &&
            'ui:hover:bg-accent ui:focus-visible:bg-accent ui:-mx-2 ui:-my-[3px] ui:px-2 ui:py-[3px] ui:focus-visible:ring-0 ui:empty:before:font-semibold'
        )}
        testId={testId ? `${testId}-title` : undefined}
        onInput={(nextTitle) => onTitleInput?.(nextTitle)}
      />
      <p
        class="ui:text-muted-foreground ui:m-0 ui:text-[12.5px]"
        data-testid={testId ? `${testId}-summary` : undefined}
      >
        {labels.pointCount(points.length)}
        {#if radial}
          · {labels.total} <b class="ui:text-foreground ui:font-semibold">{formatChartValue(total)}</b>
        {:else if peak}
          · {labels.highest} <b class="ui:text-foreground ui:font-semibold">{peak.label}</b> ({formatChartValue(
            peak.value
          )})
        {/if}
      </p>
    </div>

    {#if editable}
      <Tooltip.Provider>
        <Tabs.List aria-label={labels.chartType} class="ui:h-auto ui:shrink-0 ui:gap-0.5 ui:rounded-lg ui:p-[3px]">
          {#each CHART_TYPES as chartType (chartType)}
            <Tooltip.Root>
              <Tooltip.Trigger>
                {#snippet child({ props })}
                  {@const { 'data-slot': _tooltipSlot, ...tooltipProps } = props}
                  <Tabs.Trigger
                    {...tooltipProps}
                    value={chartType}
                    aria-label={labels.types[chartType]}
                    data-testid={testId ? `${testId}-type-${chartType}` : undefined}
                    class="ui:text-muted-foreground ui:hover:text-foreground ui:data-[state=active]:bg-card ui:data-[state=active]:text-primary ui:dark:data-[state=active]:bg-card ui:dark:data-[state=active]:text-primary ui:h-[30px] ui:w-9 ui:flex-none ui:px-0 ui:data-[state=active]:shadow-none"
                  >
                    {@render typeIcon(chartType)}
                  </Tabs.Trigger>
                {/snippet}
              </Tooltip.Trigger>
              <Tooltip.Content>
                <p>{labels.types[chartType]}</p>
              </Tooltip.Content>
            </Tooltip.Root>
          {/each}
        </Tabs.List>
      </Tooltip.Provider>
    {/if}
  </div>

  {#if editable}
    <Tabs.Content value={type}>
      {@render canvas()}
    </Tabs.Content>
  {:else}
    {@render canvas()}
  {/if}

  {#if editable}
    <div
      class="ui:border-border ui:shadow-none ui:flex ui:items-center ui:justify-between ui:gap-2.5 ui:border-t ui:pt-4"
    >
      <Button
        variant="outline"
        size="sm"
        aria-expanded={dataOpen}
        testId={testId ? `${testId}-data-toggle` : undefined}
        onclick={() => (dataOpen = !dataOpen)}
      >
        <TableIcon />
        {labels.editData}
        <ChevronDownIcon class={cn('ui:transition-transform', dataOpen && 'ui:rotate-180')} />
      </Button>
      <span class="chart-live-hint ui:text-muted-foreground ui:text-[12.5px]">{labels.liveHint}</span>
    </div>

    {#if dataOpen}
      <div
        bind:this={dataPanel}
        class="ui:bg-muted ui:-mt-2 ui:flex ui:flex-col ui:gap-2 ui:rounded-lg ui:p-3.5"
        data-testid={testId ? `${testId}-data` : undefined}
      >
        <div
          class="ui:text-muted-foreground ui:grid ui:grid-cols-[12px_minmax(0,1fr)_104px_30px] ui:items-center ui:gap-2.5 ui:pb-0.5 ui:text-[11px] ui:font-bold ui:tracking-[.08em] ui:uppercase"
          aria-hidden="true"
        >
          <span></span>
          <span>{labels.labelColumn}</span>
          <span>{labels.valueColumn}</span>
          <span></span>
        </div>
        {#each points as point, index (point.id)}
          <div
            class="ui:grid ui:grid-cols-[12px_minmax(0,1fr)_104px_30px] ui:items-center ui:gap-2.5"
            data-point-id={point.id}
          >
            <span class="ui:size-[11px] ui:rounded-sm" style:background={chartColor(type, index)}></span>
            <Input
              class="ui:bg-card ui:h-[34px]"
              value={point.label}
              placeholder={labels.labelPlaceholder}
              aria-label={labels.labelColumn}
              maxlength={labelMaxLength}
              oninput={(event) => onPointLabelInput?.(point.id, event.currentTarget.value)}
            />
            <NumberField
              value={point.value}
              min={0}
              max={maxValue}
              allowEmpty
              placeholder="0"
              label={labels.valueColumn}
              labelClassName="ui:sr-only"
              className="ui:gap-0"
              inputClassName="ui:bg-card ui:h-[34px]"
              onValueChange={(value) => handleValueChange(point.id, value)}
            />
            <IconButton
              size="icon-sm"
              class="ui:hover:bg-card ui:hover:text-destructive ui:size-[30px] ui:bg-transparent ui:shadow-none ui:disabled:opacity-35"
              tooltip={labels.removePoint}
              aria-label={labels.removePoint}
              disabled={!canRemovePoint}
              onclick={() => onRemovePoint?.(point.id)}
            >
              <Trash2Icon />
            </IconButton>
          </div>
        {/each}
        {#if canAddPoint}
          <Button
            type="button"
            class="ui:border-border ui:text-muted-foreground ui:hover:border-primary ui:hover:bg-primary/5 ui:hover:text-primary ui:mt-1.5 ui:flex ui:w-full ui:items-center ui:justify-center ui:gap-1.5 ui:rounded-lg ui:border-[1.5px] ui:border-dashed ui:bg-transparent ui:p-[10px] ui:text-[12.5px] ui:font-semibold ui:transition"
            data-testid={testId ? `${testId}-add` : undefined}
            onclick={addPoint}
          >
            <PlusIcon size={14} />
            {labels.addPoint}
          </Button>
        {/if}
      </div>
    {/if}
  {/if}
{/snippet}

{#if editable}
  <Tabs.Root
    value={type}
    onValueChange={selectType}
    class="ui:@container ui:gap-[22px]"
    data-testid={testId}
    data-chart-type={type}
  >
    {@render body()}
  </Tabs.Root>
{:else}
  <div class="ui:@container ui:flex ui:flex-col ui:gap-[22px]" data-testid={testId} data-chart-type={type}>
    {@render body()}
  </div>
{/if}

<style>
  .chart-axis-grid {
    --chart-height: 224px;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    column-gap: 14px;
    padding-top: 22px;
  }

  .chart-y-axis {
    position: relative;
    height: var(--chart-height);
    width: calc(var(--axis-width) * 1ch + 2px);
    font-size: 11.5px;
    color: var(--muted-foreground);
    font-variant-numeric: tabular-nums;
  }

  .chart-y-axis span {
    position: absolute;
    right: 0;
    bottom: calc(var(--position) * 1%);
    transform: translateY(50%);
    line-height: 1;
  }

  .chart-plot {
    position: relative;
    height: var(--chart-height);
  }

  .chart-gridlines {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .chart-gridlines i {
    position: absolute;
    left: 0;
    right: 0;
    bottom: calc(var(--position) * 1%);
    border-top: 1px dashed color-mix(in oklab, var(--border), var(--foreground) 7%);
  }

  .chart-gridlines i:first-child {
    border-top-style: solid;
    border-top-color: color-mix(in oklab, var(--border), var(--foreground) 14%);
  }

  .chart-x-labels {
    grid-column: 2;
    display: flex;
    margin-top: 12px;
  }

  .chart-x-labels span {
    flex: 1;
    min-width: 0;
    padding: 0 4px;
    text-align: center;
    font-size: 12.5px;
    font-weight: 500;
    color: var(--muted-foreground);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .chart-columns {
    position: absolute;
    inset: 0;
    display: flex;
  }

  .chart-column {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
  }

  .chart-value {
    font-size: 12.5px;
    font-weight: 700;
    margin-bottom: 7px;
    color: var(--foreground);
    font-variant-numeric: tabular-nums;
    transition: transform 0.15s;
  }

  .chart-bar {
    width: min(58%, 60px);
    min-height: 4px;
    border-radius: 9px 9px 3px 3px;
    background: linear-gradient(180deg, color-mix(in oklab, var(--primary) 72%, white) 0%, var(--primary) 100%);
    transform-origin: bottom;
    transition:
      filter 0.15s,
      width 0.15s,
      height 0.3s ease;
    animation: chart-grow 0.75s cubic-bezier(0.22, 0.61, 0.36, 1) backwards;
    animation-delay: calc(var(--index) * 70ms);
  }

  .chart-columns:hover .chart-column:not(:hover) .chart-bar {
    filter: saturate(0.5) brightness(1.15);
  }

  .chart-column:hover .chart-bar {
    width: min(66%, 68px);
  }

  .chart-column:hover .chart-value {
    transform: translateY(-2px);
  }

  .chart-line {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
    animation: chart-reveal 1s cubic-bezier(0.4, 0.1, 0.2, 1) backwards;
  }

  .chart-line-path {
    fill: none;
    stroke: var(--primary);
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
  }

  .chart-dot {
    position: absolute;
    width: 12px;
    height: 12px;
    border-radius: 999px;
    background: var(--card);
    border: 3px solid var(--primary);
    transform: translate(-50%, 50%);
    box-sizing: border-box;
    transition:
      transform 0.15s,
      box-shadow 0.15s;
    animation: chart-fade 0.4s ease backwards;
    animation-delay: calc(0.5s + var(--index) * 70ms);
  }

  .chart-dot em {
    position: absolute;
    bottom: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
    font-style: normal;
    font-size: 12.5px;
    font-weight: 700;
    color: var(--foreground);
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }

  .chart-dot:hover {
    transform: translate(-50%, 50%) scale(1.25);
    box-shadow: 0 0 0 5px color-mix(in oklab, var(--primary) 18%, transparent);
  }

  .chart-radial {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 40px;
    flex-wrap: wrap;
    padding: 4px 0;
  }

  .chart-pie {
    position: relative;
    width: 208px;
    height: 208px;
    flex-shrink: 0;
  }

  .chart-pie svg {
    width: 100%;
    height: 100%;
    display: block;
    overflow: visible;
  }

  .chart-slice {
    stroke: var(--card);
    stroke-width: 1.4;
    stroke-linejoin: round;
    transition:
      opacity 0.15s,
      transform 0.2s;
    transform-box: view-box;
    transform-origin: 50% 50%;
    animation: chart-pop 0.55s cubic-bezier(0.22, 0.61, 0.36, 1) backwards;
    animation-delay: calc(var(--index) * 80ms);
  }

  .chart-slice:hover {
    transform: scale(1.035);
  }

  .chart-slice.dim {
    opacity: 0.3;
  }

  .chart-empty-ring {
    fill: none;
    stroke: var(--border);
  }

  .chart-pie-center {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  .chart-pie-center strong {
    font-size: 26px;
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1.1;
    font-variant-numeric: tabular-nums;
  }

  .chart-pie-center span {
    font-size: 12px;
    color: var(--muted-foreground);
    font-weight: 500;
  }

  .chart-legend {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 200px;
    max-width: 340px;
  }

  .chart-legend li {
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 8px 12px;
    border-radius: calc(var(--radius) - 2px);
    font-size: 14px;
    transition:
      background 0.12s,
      opacity 0.15s;
  }

  .chart-legend li:hover {
    background: var(--accent);
  }

  .chart-legend li.dim {
    opacity: 0.45;
  }

  .chart-swatch {
    width: 11px;
    height: 11px;
    border-radius: 4px;
    background: var(--color);
    flex-shrink: 0;
  }

  .chart-legend-name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
  }

  .chart-legend-value {
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .chart-legend-percent {
    width: 40px;
    text-align: right;
    color: var(--muted-foreground);
    font-size: 12.5px;
    font-variant-numeric: tabular-nums;
  }

  .chart-canvas:not(.in-view) :global(*) {
    animation-play-state: paused;
  }

  @container (max-width: 460px) {
    .chart-radial {
      gap: 14px;
      flex-direction: column;
    }

    .chart-legend {
      max-width: none;
      width: 100%;
    }

    .chart-axis-grid {
      --chart-height: 188px;
    }

    .chart-live-hint {
      display: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .chart-bar,
    .chart-line,
    .chart-dot,
    .chart-slice {
      animation: none;
    }
  }

  @keyframes chart-grow {
    from {
      transform: scaleY(0);
      opacity: 0;
    }
    to {
      transform: scaleY(1);
      opacity: 1;
    }
  }

  @keyframes chart-reveal {
    from {
      clip-path: inset(-8px 100% -8px 0);
    }
    to {
      clip-path: inset(-8px -2px -8px -2px);
    }
  }

  @keyframes chart-fade {
    from {
      opacity: 0;
      transform: translate(-50%, 50%) scale(0.6);
    }
    to {
      opacity: 1;
      transform: translate(-50%, 50%);
    }
  }

  @keyframes chart-pop {
    from {
      opacity: 0;
      transform: scale(0.88);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
</style>
