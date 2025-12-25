<script lang="ts">
  import { Separator as SeparatorPrimitive } from 'bits-ui';
  import { cn } from '../../tools';

  let {
    ref = $bindable(null),
    class: className,
    'data-slot': dataSlot = 'separator',
    ...restProps
  }: SeparatorPrimitive.RootProps = $props();
</script>

<SeparatorPrimitive.Root
  bind:ref
  data-slot={dataSlot}
  class={cn(
    'ui:bg-border ui:shrink-0 ui:data-[orientation=horizontal]:h-px ui:data-[orientation=vertical]:h-full ui:data-[orientation=horizontal]:w-full ui:data-[orientation=vertical]:w-px',
    className
  )}
  {...restProps}
/>
