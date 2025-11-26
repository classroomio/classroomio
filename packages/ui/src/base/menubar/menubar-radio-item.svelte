<script lang="ts">
  import { Menubar as MenubarPrimitive } from 'bits-ui';
  import CircleIcon from '@lucide/svelte/icons/circle';
  import { cn, type WithoutChild } from '../../tools';

  let {
    ref = $bindable(null),
    class: className,
    children: childrenProp,
    ...restProps
  }: WithoutChild<MenubarPrimitive.RadioItemProps> = $props();
</script>

<MenubarPrimitive.RadioItem
  bind:ref
  data-slot="menubar-radio-item"
  class={cn(
<<<<<<< HEAD
    "focus:bg-accent focus:text-accent-foreground rounded-xs outline-hidden relative flex cursor-default select-none items-center gap-2 py-1.5 pl-8 pr-2 text-sm data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
=======
    "ui:focus:bg-accent ui:focus:text-accent-foreground ui:rounded-xs ui:outline-hidden ui:relative ui:flex ui:cursor-default ui:select-none ui:items-center ui:gap-2 ui:py-1.5 ui:pl-8 ui:pr-2 ui:text-sm ui:data-disabled:pointer-events-none ui:data-disabled:opacity-50 ui:[&_svg:not([class*='size-'])]:size-4 ui:[&_svg]:pointer-events-none ui:[&_svg]:shrink-0",
>>>>>>> feat/release-v2
    className
  )}
  {...restProps}
>
  {#snippet children({ checked })}
<<<<<<< HEAD
    <span class="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
      {#if checked}
        <CircleIcon class="size-2 fill-current" />
=======
    <span class="ui:pointer-events-none ui:absolute ui:left-2 ui:flex ui:size-3.5 ui:items-center ui:justify-center">
      {#if checked}
        <CircleIcon class="ui:size-2 ui:fill-current" />
>>>>>>> feat/release-v2
      {/if}
    </span>
    {@render childrenProp?.({ checked })}
  {/snippet}
</MenubarPrimitive.RadioItem>
