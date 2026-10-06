<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    class?: string;
    face?: string;
    children?: Snippet;
  }

  let { class: className = 'bg-gray-50', face = 'var(--color-gray-50)', children }: Props = $props();
</script>

<div
  class="relative overflow-hidden rounded-xl p-6 md:p-10 {className}"
  style:--machine-ink="var(--color-blue-700)"
  style:--machine-face={face}
>
  {@render children?.()}
</div>
