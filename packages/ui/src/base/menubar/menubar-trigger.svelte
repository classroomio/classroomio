<script lang="ts">
  import { Menubar as MenubarPrimitive } from 'bits-ui';
  import { cn } from '../../tools';

  let { ref = $bindable(null), class: className, ...restProps }: MenubarPrimitive.TriggerProps = $props();
</script>

<MenubarPrimitive.Trigger
  bind:ref
  data-slot="menubar-trigger"
  class={cn(
    'ui:focus:bg-accent ui:focus:text-accent-foreground ui:data-[state=open]:bg-accent ui:data-[state=open]:text-accent-foreground ui:outline-hidden ui:flex ui:select-none ui:items-center ui:rounded-sm ui:px-2 ui:py-1 ui:text-sm ui:font-medium',
    className
  )}
  {...restProps}
/>
