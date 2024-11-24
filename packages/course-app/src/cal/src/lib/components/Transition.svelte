<script lang="ts">
  import { fade } from 'svelte/transition';
  import { page } from '$app/stores';

  interface Props {
    children: import('svelte').Snippet;
  }

  let { children }: Props = $props();
</script>

{#if $page.url.pathname.includes('/course/')}
  {@render children?.()}
{:else}
  {#key $page.url.pathname}
    <div class="transition" in:fade>
      {@render children?.()}
    </div>
  {/key}
{/if}

<style>
  .transition {
    height: 100%;
  }
</style>
