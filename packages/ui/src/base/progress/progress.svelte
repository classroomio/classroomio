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
  class={cn('ui:bg-primary/20 ui:relative ui:h-2 ui:w-full ui:overflow-hidden ui:rounded-md', className)}
  {value}
  {max}
  {...restProps}
>
  <div
    data-slot="progress-indicator"
    class="ui:bg-primary ui:h-full ui:w-full ui:flex-1 ui:transition-all"
    style="transform: translateX(-{100 - (100 * (value ?? 0)) / (max ?? 1)}%)"
  ></div>
</ProgressPrimitive.Root>
