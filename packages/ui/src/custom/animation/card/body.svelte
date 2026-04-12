<script lang="ts">
  import { cn } from '../../../tools';
  import type { Snippet } from 'svelte';

  interface Props {
    className?: string;
    children: Snippet;
  }

  let { children, className }: Props = $props();
</script>

<div class={cn('p-4 text-left', className)}>
  {@render children()}
</div>
