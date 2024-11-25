<script lang="ts">
  import { blur } from 'svelte/transition';
  import { page } from '$app/stores';

  let { data } = $props();
</script>

{#key $page.url.pathname}
  <article
    class="max-w-4xl mx-auto p-4 md:p-10 md:border border-[#D0D1C9] rounded-lg min-h-[90vh]"
    in:blur
  >
    <p class="font-semibold text-2xl text-center mb-4 capitalize">
      {@html data.meta.title}
    </p>
    <div class="prose mt-2">
      <data.content />
    </div>
  </article>
{/key}

<style>
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
