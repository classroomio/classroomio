<script lang="ts">
  import { cn } from '../../../tools';
  import { Motion } from 'svelte-motion';
  import type { Snippet } from 'svelte';

  interface Props {
    variant?: {
      hidden: { filter: string; opacity: number };
      visible: { filter: string; opacity: number };
    };
    duration?: number;
    class?: string;
    children?: Snippet;
  }

  let {
    variant,
    duration = 1,
    class: className = 'text-4xl font-bold tracking-[-0.02em] drop-shadow-sm md:text-7xl md:leading-20',
    children
  }: Props = $props();

  const defaultVariants = {
    hidden: { filter: 'blur(10px)', opacity: 0 },
    visible: { filter: 'blur(0px)', opacity: 1 }
  };
  const combinedVariants = $derived(variant ?? defaultVariants);
</script>

<Motion initial="hidden" animate="visible" transition={{ duration }} variants={combinedVariants} let:motion>
  <h1 class={cn(className)} use:motion>
    {@render children?.()}
  </h1>
</Motion>
