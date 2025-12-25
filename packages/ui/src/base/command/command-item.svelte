<script lang="ts">
  import { Command as CommandPrimitive } from 'bits-ui';
  import { cn } from '../../tools';

  let { ref = $bindable(null), class: className, ...restProps }: CommandPrimitive.ItemProps = $props();
</script>

<CommandPrimitive.Item
  bind:ref
  data-slot="command-item"
  class={cn(
    "ui:aria-selected:bg-accent ui:aria-selected:text-accent-foreground ui:[&_svg:not([class*='text-'])]:text-muted-foreground ui:outline-hidden ui:relative ui:flex ui:cursor-default ui:select-none ui:items-center ui:gap-2 ui:rounded-sm ui:px-2 ui:py-1.5 ui:text-sm ui:data-disabled:pointer-events-none ui:data-disabled:opacity-50 ui:[&_svg:not([class*='size-'])]:size-4 ui:[&_svg]:pointer-events-none ui:[&_svg]:shrink-0",
    className
  )}
  {...restProps}
/>
