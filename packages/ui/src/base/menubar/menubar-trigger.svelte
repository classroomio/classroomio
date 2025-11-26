<script lang="ts">
  import { Menubar as MenubarPrimitive } from 'bits-ui';
  import { cn } from '../../tools';

  let { ref = $bindable(null), class: className, ...restProps }: MenubarPrimitive.TriggerProps = $props();
</script>

<MenubarPrimitive.Trigger
  bind:ref
  data-slot="menubar-trigger"
  class={cn(
<<<<<<< HEAD
    'focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground outline-hidden flex select-none items-center rounded-sm px-2 py-1 text-sm font-medium',
=======
    'ui:focus:bg-accent ui:focus:text-accent-foreground ui:data-[state=open]:bg-accent ui:data-[state=open]:text-accent-foreground ui:outline-hidden ui:flex ui:select-none ui:items-center ui:rounded-sm ui:px-2 ui:py-1 ui:text-sm ui:font-medium',
>>>>>>> feat/release-v2
    className
  )}
  {...restProps}
/>
