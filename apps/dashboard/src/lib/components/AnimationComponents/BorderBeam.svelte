<script lang="ts">
  import { cn } from '$lib/utils/types';

  export let size = 200;
  export let duration = 15;
  export let anchor = 90;
  export let borderWidth = 1.5;
  export let colorFrom = '#ffaa40';
  export let colorTo = '#9c40ff';
  export let delay = 0;
  let delaySec = delay + 's';

  let className: any = '';
  export { className as class };
</script>

<div
  style:--border-width={borderWidth}
  style:--size={size}
  style:--color-from={colorFrom}
  style:--color-to={colorTo}
  style:--delay={delaySec}
  style:--anchor={anchor}
  style:--duration={duration}
  class={cn(
    'pointer-events-none absolute inset-[0] rounded-[inherit] [border:calc(var(--border-width)*1px)_solid_transparent]',

    // mask styles
    '![mask-clip:padding-box,border-box] ![mask-composite:intersect] [mask:linear-gradient(transparent,transparent),linear-gradient(white,white)]',

    // pseudo styles
    'after:absolute after:aspect-square after:w-[calc(var(--size)*1px)] after:animate-border-beam after:[animation-delay:var(--delay)] after:[background:linear-gradient(to_left,var(--color-from),var(--color-to),transparent)] after:[offset-anchor:calc(var(--anchor)*1%)_50%] after:[offset-path:rect(0_auto_auto_0_round_calc(var(--size)*1px))]',
    className
  )}
></div>
