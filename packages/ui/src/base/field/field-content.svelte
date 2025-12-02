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
  data-slot="field-content"
  class={cn('ui:group/field-content ui:flex ui:flex-1 ui:flex-col ui:gap-1.5 ui:leading-snug', className)}
  {...restProps}
>
  {@render children?.()}
</div>
