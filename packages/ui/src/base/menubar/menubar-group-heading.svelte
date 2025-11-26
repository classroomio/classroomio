<script lang="ts">
  import { cn } from '../../tools';
  import { Menubar as MenubarPrimitive } from 'bits-ui';
  import type { ComponentProps } from 'svelte';

  let {
    ref = $bindable(null),
    inset,
    class: className,
    ...restProps
  }: ComponentProps<typeof MenubarPrimitive.GroupHeading> & {
    inset?: boolean;
  } = $props();
</script>

<MenubarPrimitive.GroupHeading
  bind:ref
  data-slot="menubar-group-heading"
  data-inset={inset}
<<<<<<< HEAD
  class={cn('px-2 py-1.5 text-sm font-medium data-[inset]:pl-8', className)}
=======
  class={cn('ui:px-2 ui:py-1.5 ui:text-sm ui:font-medium ui:data-inset:pl-8', className)}
>>>>>>> feat/release-v2
  {...restProps}
/>
