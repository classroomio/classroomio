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
    "ui:focus:bg-accent ui:focus:text-accent-foreground ui:rounded-xs ui:outline-hidden ui:relative ui:flex ui:cursor-default ui:select-none ui:items-center ui:gap-2 ui:py-1.5 ui:pl-8 ui:pr-2 ui:text-sm ui:data-disabled:pointer-events-none ui:data-disabled:opacity-50 ui:[&_svg:not([class*='size-'])]:size-4 ui:[&_svg]:pointer-events-none ui:[&_svg]:shrink-0",
    className
  )}
  {...restProps}
>
  {#snippet children({ checked })}
    <span class="ui:pointer-events-none ui:absolute ui:left-2 ui:flex ui:size-3.5 ui:items-center ui:justify-center">
      {#if checked}
        <CircleIcon class="ui:size-2 ui:fill-current" />
      {/if}
    </span>
    {@render childrenProp?.({ checked })}
  {/snippet}
</MenubarPrimitive.RadioItem>
