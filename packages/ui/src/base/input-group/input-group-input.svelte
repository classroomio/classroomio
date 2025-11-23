<script lang="ts">
  import { cn } from '../../tools';
  import type { ComponentProps } from 'svelte';
  import { Input } from '$src/base/input/index.js';

  let {
    ref = $bindable(null),
    value = $bindable(),
    class: className,
    ...props
  }: ComponentProps<typeof Input> = $props();
</script>

<Input
  bind:ref
  data-slot="input-group-control"
  class={cn(
    'ui:flex-1 ui:rounded-none ui:border-0 ui:bg-transparent ui:shadow-none ui:focus-visible:ring-0 ui:dark:bg-transparent',
    className
  )}
  bind:value
  {...props}
/>
