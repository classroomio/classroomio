<script>
  import Accordion from './Accordion.svelte';
  export let data;
</script>

{#if data.faq.show}
  <section class="px-4 pt-4 pb-20 h-full bg-[#F9F9F9]">
    <h1 class="text-center text-3xl text-[#3F3F3F] font-bold mb-4">{data.faq.title}</h1>
    <section class="p-4 space-y-10 w-full md:w-[80%] mx-auto">
      {#each data.faq.questions as faq}
        <Accordion title={faq.title} content={faq.content} />
      {/each}
    </section>
  </section>
{/if}
