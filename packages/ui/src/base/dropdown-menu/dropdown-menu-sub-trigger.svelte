<script lang="ts">
  import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import { cn } from '../../tools';

  let {
    ref = $bindable(null),
    class: className,
    inset,
    children,
    ...restProps
  }: DropdownMenuPrimitive.SubTriggerProps & {
    inset?: boolean;
  } = $props();
</script>

<DropdownMenuPrimitive.SubTrigger
  bind:ref
  data-slot="dropdown-menu-sub-trigger"
  data-inset={inset}
  class={cn(
    "ui:data-highlighted:bg-accent ui:data-highlighted:text-accent-foreground ui:data-[state=open]:bg-accent ui:data-[state=open]:text-accent-foreground ui:outline-hidden ui:[&_svg:not([class*='text-'])]:text-muted-foreground ui:flex ui:cursor-default ui:select-none ui:items-center ui:gap-2 ui:rounded-sm ui:px-2 ui:py-1.5 ui:text-sm ui:data-disabled:pointer-events-none ui:data-inset:pl-8 ui:data-disabled:opacity-50 ui:[&_svg:not([class*='size-'])]:size-4 ui:[&_svg]:pointer-events-none ui:[&_svg]:shrink-0",
    className
  )}
  {...restProps}
>
  {@render children?.()}
  <ChevronRightIcon class="ui:ml-auto ui:size-4" />
</DropdownMenuPrimitive.SubTrigger>
