<script lang="ts">
  import { Menubar as MenubarPrimitive } from 'bits-ui';
  import { cn } from '../../tools';

  let { ref = $bindable(null), class: className, ...restProps }: MenubarPrimitive.RootProps = $props();
</script>

<MenubarPrimitive.Root
  bind:ref
  data-slot="menubar"
  class={cn(
    'ui:bg-background ui:shadow-xs ui:flex ui:h-9 ui:items-center ui:gap-1 ui:rounded-md ui:border ui:p-1',
    className
  )}
  {...restProps}
/>
