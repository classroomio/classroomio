<script lang="ts">
  import { box } from 'svelte-toolbelt';
  import { usePassword } from './password-util.svelte';
  import type { PasswordRootProps } from './types';
  import { cn } from '../../tools';

  let {
    ref = $bindable(null),
    hidden = $bindable(true),
    minScore = 3,
    class: className,
    children
  }: PasswordRootProps = $props();

  usePassword({
    hidden: box.with(
      () => hidden,
      (v) => (hidden = v)
    ),
    minScore: box.with(() => minScore)
  });
</script>

<div bind:this={ref} class={cn('ui:flex ui:flex-col ui:gap-2', className)}>
  {@render children?.()}
</div>
