<script lang="ts">
  import { Select as SelectPrimitive } from 'bits-ui';
  import { cn } from '../../tools';
  import type { ComponentProps } from 'svelte';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: ComponentProps<typeof SelectPrimitive.GroupHeading> = $props();
</script>

<SelectPrimitive.GroupHeading
  bind:ref
  data-slot="select-group-heading"
  class={cn('ui:text-muted-foreground ui:px-2 ui:py-1.5 ui:text-xs', className)}
  {...restProps}
>
  {@render children?.()}
</SelectPrimitive.GroupHeading>
