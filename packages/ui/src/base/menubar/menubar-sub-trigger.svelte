<script lang="ts">
  import { Menubar as MenubarPrimitive } from 'bits-ui';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import { cn, type WithoutChild } from '../../tools';

  let {
    ref = $bindable(null),
    class: className,
    inset = undefined,
    children,
    ...restProps
  }: WithoutChild<MenubarPrimitive.SubTriggerProps> & {
    inset?: boolean;
  } = $props();
</script>

<MenubarPrimitive.SubTrigger
  bind:ref
  data-slot="menubar-sub-trigger"
  data-inset={inset}
  class={cn(
    'ui:focus:bg-accent ui:focus:text-accent-foreground ui:data-[state=open]:bg-accent ui:data-[state=open]:text-accent-foreground ui:flex ui:cursor-default ui:select-none ui:items-center ui:rounded-sm ui:px-2 ui:py-1.5 ui:text-sm ui:outline-none ui:data-inset:pl-8',
    className
  )}
  {...restProps}
>
  {@render children?.()}
  <ChevronRightIcon class="ui:ml-auto ui:size-4" />
</MenubarPrimitive.SubTrigger>
