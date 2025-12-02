<script lang="ts">
  import { cn } from '../../tools';
  import type { ComponentProps } from 'svelte';
  import { Separator } from '../separator';

  let {
    ref = $bindable(null),
    class: className,
    orientation = 'vertical',
    ...restProps
  }: ComponentProps<typeof Separator> = $props();
</script>

<Separator
  bind:ref
  data-slot="button-group-separator"
  {orientation}
  class={cn('ui:bg-input ui:relative ui:m-0! ui:self-stretch ui:data-[orientation=vertical]:h-auto', className)}
  {...restProps}
/>
