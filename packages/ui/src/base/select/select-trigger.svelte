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
    "ui:border-input ui:data-placeholder:text-muted-foreground ui:[&_svg:not([class*='text-'])]:text-muted-foreground ui:focus-visible:border-ring ui:focus-visible:ring-ring/50 ui:aria-invalid:ring-destructive/20 ui:dark:aria-invalid:ring-destructive/40 ui:aria-invalid:border-destructive ui:dark:bg-input/30 ui:dark:hover:bg-input/50 ui:shadow-xs ui:flex ui:w-fit ui:select-none ui:items-center ui:justify-between ui:gap-2 ui:whitespace-nowrap ui:rounded-md ui:border ui:bg-transparent ui:px-3 ui:py-2 ui:text-sm ui:outline-none ui:transition-[color,box-shadow] ui:focus-visible:ring-[3px] ui:data-disabled:cursor-not-allowed ui:data-disabled:opacity-50 ui:data-[size=default]:h-9 ui:data-[size=sm]:h-8 ui:**:data-[slot=select-value]:line-clamp-1 ui:**:data-[slot=select-value]:flex ui:**:data-[slot=select-value]:items-center ui:**:data-[slot=select-value]:gap-2 ui:[&_svg:not([class*='size-'])]:size-4 ui:[&_svg]:pointer-events-none ui:[&_svg]:shrink-0",
    className
  )}
  {...restProps}
>
  {@render children?.()}
  <ChevronDownIcon class="ui:size-4 ui:opacity-50" />
</SelectPrimitive.Trigger>
