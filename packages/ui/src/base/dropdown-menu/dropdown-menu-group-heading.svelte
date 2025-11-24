<script lang="ts">
  import { cn } from '../../tools';
  import type { ComponentProps } from 'svelte';
  import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';

  let {
    ref = $bindable(null),
    class: className,
    inset,
    ...restProps
  }: ComponentProps<typeof DropdownMenuPrimitive.GroupHeading> & {
    inset?: boolean;
  } = $props();
</script>

<DropdownMenuPrimitive.GroupHeading
  bind:ref
  data-slot="dropdown-menu-group-heading"
  data-inset={inset}
  class={cn('ui:px-2 ui:py-1.5 ui:text-sm ui:font-semibold ui:data-inset:pl-8', className)}
  {...restProps}
/>
