<script lang="ts">
  import { cn, type WithElementRef } from '../../tools';
  import type { HTMLAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
  bind:this={ref}
  data-slot="field-group"
  class={cn(
    'ui:group/field-group ui:@container/field-group ui:flex ui:w-full ui:flex-col ui:gap-7 ui:data-[slot=checkbox-group]:gap-3 ui:*:data-[slot=field-group]:gap-4',
    className
  )}
  {...restProps}
>
  {@render children?.()}
</div>
