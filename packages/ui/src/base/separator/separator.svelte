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
<<<<<<< HEAD
    'bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=vertical]:h-full data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px',
=======
    'ui:bg-border ui:shrink-0 ui:data-[orientation=horizontal]:h-px ui:data-[orientation=vertical]:h-full ui:data-[orientation=horizontal]:w-full ui:data-[orientation=vertical]:w-px',
>>>>>>> feat/release-v2
    className
  )}
  {...restProps}
/>
