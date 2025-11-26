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
<<<<<<< HEAD
    'focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[inset]:pl-8',
=======
    'ui:focus:bg-accent ui:focus:text-accent-foreground ui:data-[state=open]:bg-accent ui:data-[state=open]:text-accent-foreground ui:flex ui:cursor-default ui:select-none ui:items-center ui:rounded-sm ui:px-2 ui:py-1.5 ui:text-sm ui:outline-none ui:data-inset:pl-8',
>>>>>>> feat/release-v2
    className
  )}
  {...restProps}
>
  {@render children?.()}
<<<<<<< HEAD
  <ChevronRightIcon class="ml-auto size-4" />
=======
  <ChevronRightIcon class="ui:ml-auto ui:size-4" />
>>>>>>> feat/release-v2
</MenubarPrimitive.SubTrigger>
