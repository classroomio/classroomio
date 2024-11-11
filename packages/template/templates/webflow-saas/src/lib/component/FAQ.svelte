<script lang="ts">
  import Accordion from './Accordion.svelte';

  let { data } = $props();
</script>

{#if data.faq.show}
  <section id="faq" class="px-2 pt-4 pb-20 h-full">
    <h1 class="text-center text-3xl font-bold mb-4">{data.faq.title}</h1>
    <section class="py-4 px-2 space-y-10 w-full mx-auto">
      {#each data.faq.questions as faq}
        <Accordion title={faq.title} content={faq.content} />
      {/each}
    </section>
  </section>
{/if}
