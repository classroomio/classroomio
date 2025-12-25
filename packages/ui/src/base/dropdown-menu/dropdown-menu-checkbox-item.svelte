<script lang="ts">
  import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
  import CheckIcon from '@lucide/svelte/icons/check';
  import MinusIcon from '@lucide/svelte/icons/minus';
  import { cn, type WithoutChildrenOrChild } from '../../tools';
  import type { Snippet } from 'svelte';

  let {
    ref = $bindable(null),
    checked = $bindable(false),
    indeterminate = $bindable(false),
    class: className,
    children: childrenProp,
    ...restProps
  }: WithoutChildrenOrChild<DropdownMenuPrimitive.CheckboxItemProps> & {
    children?: Snippet;
  } = $props();
</script>

<DropdownMenuPrimitive.CheckboxItem
  bind:ref
  bind:checked
  bind:indeterminate
  data-slot="dropdown-menu-checkbox-item"
  class={cn(
    "ui:focus:bg-accent ui:focus:text-accent-foreground ui:outline-hidden ui:relative ui:flex ui:cursor-default ui:select-none ui:items-center ui:gap-2 ui:rounded-sm ui:py-1.5 ui:pl-8 ui:pr-2 ui:text-sm ui:data-disabled:pointer-events-none ui:data-disabled:opacity-50 ui:[&_svg:not([class*='size-'])]:size-4 ui:[&_svg]:pointer-events-none ui:[&_svg]:shrink-0",
    className
  )}
  {...restProps}
>
  {#snippet children({ checked, indeterminate })}
    <span class="ui:pointer-events-none ui:absolute ui:left-2 ui:flex ui:size-3.5 ui:items-center ui:justify-center">
      {#if indeterminate}
        <MinusIcon class="ui:size-4" />
      {:else}
        <CheckIcon class={cn('ui:size-4', !checked && 'text-transparent')} />
      {/if}
    </span>
    {@render childrenProp?.()}
  {/snippet}
</DropdownMenuPrimitive.CheckboxItem>
