<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    size?: 'md' | 'sm';
    class?: string;
    children?: Snippet;
  }

  let { size = 'md', class: className = 'text-gray-500', children }: Props = $props();

  const sizeClass = $derived(size === 'sm' ? 'text-label' : 'text-eyebrow');
</script>

<p class="font-mono uppercase {sizeClass} {className}">
  {@render children?.()}
</p>
