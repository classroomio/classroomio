<script lang="ts">
  import { blur } from 'svelte/transition';
  import { page } from '$app/state';

  let { data } = $props();
</script>

{#key page.url.pathname}
  <article class="mx-auto min-h-[90vh] max-w-4xl rounded-lg border-[#D0D1C9] p-4 md:border md:p-10" in:blur>
    <p class="mb-4 text-center text-2xl font-semibold capitalize">
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
