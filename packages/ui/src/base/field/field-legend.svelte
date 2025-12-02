<script lang="ts">
  import { cn, type WithElementRef } from '../../tools';
  import type { HTMLAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    class: className,
    variant = 'legend',
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLLegendElement>> & {
    variant?: 'legend' | 'label';
  } = $props();
</script>

<legend
  bind:this={ref}
  data-slot="field-legend"
  data-variant={variant}
  class={cn(
    'ui:mb-3 ui:font-medium',
    'ui:data-[variant=legend]:text-base',
    'ui:data-[variant=label]:text-sm',
    className
  )}
  {...restProps}
>
  {@render children?.()}
</legend>
