<script lang="ts">
  import { Progress as ProgressPrimitive } from 'bits-ui';
  import { cn, type WithoutChildrenOrChild } from '../../tools';

  let {
    ref = $bindable(null),
    class: className,
    max = 100,
    value,
    ...restProps
  }: WithoutChildrenOrChild<ProgressPrimitive.RootProps> = $props();
</script>

<ProgressPrimitive.Root
  bind:ref
  data-slot="progress"
<<<<<<< HEAD
  class={cn('bg-primary/20 relative h-2 w-full overflow-hidden rounded-full', className)}
=======
  class={cn('ui:bg-primary/20 ui:relative ui:h-2 ui:w-full ui:overflow-hidden ui:rounded-full', className)}
>>>>>>> feat/release-v2
  {value}
  {max}
  {...restProps}
>
  <div
    data-slot="progress-indicator"
<<<<<<< HEAD
    class="bg-primary h-full w-full flex-1 transition-all"
=======
    class="ui:bg-primary ui:h-full ui:w-full ui:flex-1 ui:transition-all"
>>>>>>> feat/release-v2
    style="transform: translateX(-{100 - (100 * (value ?? 0)) / (max ?? 1)}%)"
  ></div>
</ProgressPrimitive.Root>
