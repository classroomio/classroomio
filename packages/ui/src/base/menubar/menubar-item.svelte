<script lang="ts">
  import { Menubar as MenubarPrimitive } from 'bits-ui';
  import { cn } from '../../tools';

  let {
    ref = $bindable(null),
    class: className,
    inset = undefined,
    variant = 'default',
    ...restProps
  }: MenubarPrimitive.ItemProps & {
    inset?: boolean;
    variant?: 'default' | 'destructive';
  } = $props();
</script>

<MenubarPrimitive.Item
  bind:ref
  data-slot="menubar-item"
  data-inset={inset}
  data-variant={variant}
  class={cn(
<<<<<<< HEAD
    "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground outline-hidden relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm data-[disabled]:pointer-events-none data-[inset]:pl-8 data-[disabled]:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
=======
    "ui:focus:bg-accent ui:focus:text-accent-foreground ui:data-[variant=destructive]:text-destructive ui:data-[variant=destructive]:focus:bg-destructive/10 ui:dark:ui:data-[variant=destructive]:focus:bg-destructive/20 ui:data-[variant=destructive]:focus:text-destructive ui:data-[variant=destructive]:*:[svg]:text-destructive! ui:[&_svg:not([class*='text-'])]:text-muted-foreground ui:outline-hidden ui:relative ui:flex ui:cursor-default ui:select-none ui:items-center ui:gap-2 ui:rounded-sm ui:px-2 ui:py-1.5 ui:text-sm ui:data-disabled:pointer-events-none ui:data-inset:pl-8 ui:data-disabled:opacity-50 ui:[&_svg:not([class*='size-'])]:size-4 ui:[&_svg]:pointer-events-none ui:[&_svg]:shrink-0",
>>>>>>> feat/release-v2
    className
  )}
  {...restProps}
/>
