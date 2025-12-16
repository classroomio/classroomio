<script lang="ts">
  import { fade } from 'svelte/transition';

  interface Props {
    id: string;
    children: import('svelte').Snippet;
  }

  let { id, children }: Props = $props();
</script>

<section {id} transition:fade={{ delay: 250, duration: 300 }} class="border-b border-gray-300 pb-10 pt-12">
  {@render children()}
</section>
