<script lang="ts">
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import { Select as SelectPrimitive } from 'bits-ui';
  import { cn, type WithoutChildrenOrChild } from '../../tools';

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: WithoutChildrenOrChild<SelectPrimitive.ScrollDownButtonProps> = $props();
</script>

<SelectPrimitive.ScrollDownButton
  bind:ref
  data-slot="select-scroll-down-button"
<<<<<<< HEAD
  class={cn('flex cursor-default items-center justify-center py-1', className)}
  {...restProps}
>
  <ChevronDownIcon class="size-4" />
=======
  class={cn('ui:flex ui:cursor-default ui:items-center ui:justify-center ui:py-1', className)}
  {...restProps}
>
  <ChevronDownIcon class="ui:size-4" />
>>>>>>> feat/release-v2
</SelectPrimitive.ScrollDownButton>
