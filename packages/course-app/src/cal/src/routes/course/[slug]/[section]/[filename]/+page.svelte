<script lang="ts">
  import { blur } from 'svelte/transition';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  let { data } = $props();
</script>

{#key $page.url.pathname}
  <article class="max-w-3xl" in:blur>
    <p class="font-semibold text-2xl text-center mb-4 capitalize">
      {@html data.meta.title}
    </p>
    <div class="prose pt-2 pb-4 border-b border-gray-200">
      {@html data.html}
    </div>
  </article>
{/key}

<style>
  :global(.prose :is(p, li)) {
    margin-top: 0.7em;
    margin-bottom: 0em;
    color: #374151;
  }

  :global(.prose img + em) {
    display: block;
    font-size: 14px;
    margin-bottom: 40px;
    border: none;
    padding: none;
    text-align: center;
  }

  :global(.prose a) {
    text-decoration: underline;
    font-weight: bold;
  }

  :global(.prose img) {
    max-height: 350px;
    border-radius: 0.375rem;
    margin: 0.5em auto;
  }
</style>
