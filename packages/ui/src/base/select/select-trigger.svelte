<script lang="ts">
  import { Select as SelectPrimitive } from 'bits-ui';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import { cn, type WithoutChild } from '../../tools';

  let {
    ref = $bindable(null),
    class: className,
    children,
    size = 'default',
    ...restProps
  }: WithoutChild<SelectPrimitive.TriggerProps> & {
    size?: 'sm' | 'default';
  } = $props();
</script>

<SelectPrimitive.Trigger
  bind:ref
  data-slot="select-trigger"
  data-size={size}
  class={cn(
<<<<<<< HEAD
    "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 shadow-xs flex w-fit select-none items-center justify-between gap-2 whitespace-nowrap rounded-md border bg-transparent px-3 py-2 text-sm outline-none transition-[color,box-shadow] focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
=======
    "ui:border-input ui:data-placeholder:text-muted-foreground ui:[&_svg:not([class*='text-'])]:text-muted-foreground ui:focus-visible:border-ring ui:focus-visible:ring-ring/50 ui:aria-invalid:ring-destructive/20 ui:dark:aria-invalid:ring-destructive/40 ui:aria-invalid:border-destructive ui:dark:bg-input/30 ui:dark:hover:bg-input/50 ui:shadow-xs ui:flex ui:w-fit ui:select-none ui:items-center ui:justify-between ui:gap-2 ui:whitespace-nowrap ui:rounded-md ui:border ui:bg-transparent ui:px-3 ui:py-2 ui:text-sm ui:outline-none ui:transition-[color,box-shadow] ui:focus-visible:ring-[3px] ui:data-disabled:cursor-not-allowed ui:data-disabled:opacity-50 ui:data-[size=default]:h-9 ui:data-[size=sm]:h-8 ui:**:data-[slot=select-value]:line-clamp-1 ui:**:data-[slot=select-value]:flex ui:**:data-[slot=select-value]:items-center ui:**:data-[slot=select-value]:gap-2 ui:[&_svg:not([class*='size-'])]:size-4 ui:[&_svg]:pointer-events-none ui:[&_svg]:shrink-0",
>>>>>>> feat/release-v2
    className
  )}
  {...restProps}
>
  {@render children?.()}
<<<<<<< HEAD
  <ChevronDownIcon class="size-4 opacity-50" />
=======
  <ChevronDownIcon class="ui:size-4 ui:opacity-50" />
>>>>>>> feat/release-v2
</SelectPrimitive.Trigger>
