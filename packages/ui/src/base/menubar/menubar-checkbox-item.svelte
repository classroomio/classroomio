<script lang="ts">
  import { Menubar as MenubarPrimitive } from 'bits-ui';
  import CheckIcon from '@lucide/svelte/icons/check';
  import MinusIcon from '@lucide/svelte/icons/minus';
  import { cn, type WithoutChildrenOrChild } from '../../tools';
  import type { Snippet } from 'svelte';

  let {
    ref = $bindable(null),
    class: className,
    checked = $bindable(false),
    indeterminate = $bindable(false),
    children: childrenProp,
    ...restProps
  }: WithoutChildrenOrChild<MenubarPrimitive.CheckboxItemProps> & {
    children?: Snippet;
  } = $props();
</script>

<MenubarPrimitive.CheckboxItem
  bind:ref
  bind:checked
  bind:indeterminate
  data-slot="menubar-checkbox-item"
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
  {#snippet children({ checked, indeterminate })}
<<<<<<< HEAD
    <span class="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
      {#if indeterminate}
        <MinusIcon class="size-4" />
      {:else}
        <CheckIcon class={cn('size-4', !checked && 'text-transparent')} />
=======
    <span class="ui:pointer-events-none ui:absolute ui:left-2 ui:flex ui:size-3.5 ui:items-center ui:justify-center">
      {#if indeterminate}
        <MinusIcon class="ui:size-4" />
      {:else}
        <CheckIcon class={cn('ui:size-4', !checked && 'text-transparent')} />
>>>>>>> feat/release-v2
      {/if}
    </span>
    {@render childrenProp?.()}
  {/snippet}
</MenubarPrimitive.CheckboxItem>
