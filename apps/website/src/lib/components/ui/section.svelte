<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    id?: string;
    class?: string;
    innerClass?: string;
    children?: Snippet;
  }

  let { id, class: className = '', innerClass = '', children }: Props = $props();
</script>

<section {id} class="xl:py-section px-6 py-20 md:px-10 md:py-28 {className}">
  <div class="max-w-content mx-auto w-full {innerClass}">
    {@render children?.()}
  </div>
</section>
