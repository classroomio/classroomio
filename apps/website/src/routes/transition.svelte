<script lang="ts">
  import { fade } from 'svelte/transition';
  interface Props {
    url: string;
    children?: import('svelte').Snippet;
  }

  let { url, children }: Props = $props();
</script>

{#key url}
  <div class="transition" in:fade>
    {@render children?.()}
  </div>
{/key}

<style>
  .transition {
    height: 100%;
  }
</style>
