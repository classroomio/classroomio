<script lang="ts">
  import { cn, type WithElementRef } from '../../tools';
  import type { HTMLAttributes } from 'svelte/elements';
  import ChartStyle from './chart-style.svelte';
  import { setChartContext, type ChartConfig } from './chart-utils';

  const uid = $props.id();

  let {
    ref = $bindable(null),
    id = uid,
    class: className,
    children,
    config,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLElement>> & {
    config: ChartConfig;
  } = $props();

  const chartId = `chart-${id || uid.replace(/:/g, '')}`;

  setChartContext({
    get config() {
      return config;
    }
  });
</script>

<div
  bind:this={ref}
  data-chart={chartId}
  data-slot="chart"
  class={cn(
    'ui:flex ui:justify-center ui:overflow-visible ui:text-xs ui:aspect-video',
    // Overrides
    //
    // Stroke around dots/marks when hovering
    'ui:[&_.stroke-white]:stroke-transparent',
    // override the default stroke color of lines
    'ui:[&_.lc-line]:stroke-border/50',

    // by default, layerchart shows a line intersecting the point when hovering, this hides that
    'ui:[&_.lc-highlight-line]:stroke-0',

    // by default, when you hover a point on a stacked series chart, it will drop the opacity
    // of the other series, this overrides that
    'ui:[&_.lc-area-path]:opacity-100 ui:[&_.lc-highlight-line]:opacity-100 ui:[&_.lc-highlight-point]:opacity-100 ui:[&_.lc-spline-path]:opacity-100 ui:[&_.lc-text]:text-xs ui:[&_.lc-text-svg]:overflow-visible',

    // We don't want the little tick lines between the axis labels and the chart, so we remove
    // the stroke. The alternative is to manually disable `tickMarks` on the x/y axis of every
    // chart.
    'ui:[&_.lc-axis-tick]:stroke-0',

    // We don't want to display the rule on the x/y axis, as there is already going to be
    // a grid line there and rule ends up overlapping the marks because it is rendered after
    // the marks
    'ui:[&_.lc-rule-x-line:not(.lc-grid-x-rule)]:stroke-0 ui:[&_.lc-rule-y-line:not(.lc-grid-y-rule)]:stroke-0',
    'ui:[&_.lc-grid-x-radial-line]:stroke-border ui:[&_.lc-grid-x-radial-circle]:stroke-border',
    'ui:[&_.lc-grid-y-radial-line]:stroke-border ui:[&_.lc-grid-y-radial-circle]:stroke-border',

    // Legend adjustments
    'ui:[&_.lc-legend-swatch-button]:items-center ui:[&_.lc-legend-swatch-button]:gap-1.5',
    'ui:[&_.lc-legend-swatch-group]:items-center ui:[&_.lc-legend-swatch-group]:gap-4',
    'ui:[&_.lc-legend-swatch]:size-2.5 ui:[&_.lc-legend-swatch]:rounded-[2px]',

    // Labels
    'ui:[&_.lc-labels-text:not([fill])]:fill-foreground ui:[&_text]:stroke-transparent',

    // Tick labels on th x/y axes
    'ui:[&_.lc-axis-tick-label]:fill-muted-foreground ui:[&_.lc-axis-tick-label]:font-normal',
    'ui:[&_.lc-tooltip-rects-g]:fill-transparent',
    'ui:[&_.lc-layout-svg-g]:fill-transparent',
    'ui:[&_.lc-root-container]:w-full',
    className
  )}
  {...restProps}
>
  <ChartStyle id={chartId} {config} />
  {@render children?.()}
</div>
