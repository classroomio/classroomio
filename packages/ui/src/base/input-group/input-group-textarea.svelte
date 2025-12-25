<script lang="ts">
  import { cn } from '../../tools';
  import { Textarea } from '../textarea';
  import type { ComponentProps } from 'svelte';

  let {
    ref = $bindable(null),
    value = $bindable(),
    class: className,
    ...props
  }: ComponentProps<typeof Textarea> = $props();
</script>

<Textarea
  bind:ref
  data-slot="input-group-control"
  class={cn(
    'ui:flex-1 ui:resize-none ui:rounded-none ui:border-0 ui:bg-transparent ui:py-3 ui:shadow-none ui:focus-visible:ring-0 ui:dark:bg-transparent',
    className
  )}
  bind:value
  {...props}
/>
