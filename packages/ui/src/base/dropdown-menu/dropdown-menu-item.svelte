<script lang="ts">
  import { cn } from '../../tools';
  import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';

  let {
    ref = $bindable(null),
    class: className,
    inset,
    variant = 'default',
    ...restProps
  }: DropdownMenuPrimitive.ItemProps & {
    inset?: boolean;
    variant?: 'default' | 'destructive';
  } = $props();
</script>

<DropdownMenuPrimitive.Item
  bind:ref
  data-slot="dropdown-menu-item"
  data-inset={inset}
  data-variant={variant}
  class={cn(
    "ui:data-highlighted:bg-accent ui:data-highlighted:text-accent-foreground ui:data-[variant=destructive]:text-destructive ui:data-[variant=destructive]:data-highlighted:bg-destructive/10 ui:dark:ui:data-[variant=destructive]:data-highlighted:bg-destructive/20 ui:data-[variant=destructive]:data-highlighted:text-destructive ui:data-[variant=destructive]:*:[svg]:text-destructive! ui:[&_svg:not([class*='text-'])]:text-muted-foreground ui:outline-hidden ui:relative ui:flex ui:cursor-default ui:select-none ui:items-center ui:gap-2 ui:rounded-sm ui:px-2 ui:py-1.5 ui:text-sm ui:data-disabled:pointer-events-none ui:data-inset:pl-8 ui:data-disabled:opacity-50 ui:[&_svg:not([class*='size-'])]:size-4 ui:[&_svg]:pointer-events-none ui:[&_svg]:shrink-0",
    className
  )}
  {...restProps}
/>
