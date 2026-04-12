<script lang="ts">
  import { cn } from '../../../tools';
  import type { SVGAttributes } from 'svelte/elements';

  interface Props extends SVGAttributes<SVGSVGElement> {
    width?: string | number;
    height?: string | number;
    x?: number;
    y?: number;
    cx?: number;
    cy?: number;
    cr?: number;
    fillColor?: string;
    class?: string;
  }

  let {
    width = 16,
    height = 16,
    x = 0,
    y = 0,
    cx = 1,
    cy = 1,
    cr = 1,
    fillColor = 'rgb(163 163 163 / 0.8)',
    class: className = '',
    ...restProps
  }: Props = $props();

  const patternId = crypto.randomUUID().toString().slice(0, 10);
</script>

<svg
  aria-hidden="true"
  class={cn('pointer-events-none absolute inset-0 h-full w-full', className)}
  {...restProps}
  fill={fillColor}
>
  <defs>
    <pattern id={patternId} {width} {height} patternUnits="userSpaceOnUse" patternContentUnits="userSpaceOnUse" {x} {y}>
      <circle id="pattern-circle" {cx} {cy} r={cr} />
    </pattern>
  </defs>
  <rect width="100%" height="100%" stroke-width={0} fill={`url(#${patternId})`} />
</svg>
