<script lang="ts">
  import Accordion from './Accordion.svelte';

  export let data;
</script>

{#if data.faq.show}
  <section id="faq" class="relative px-2 pt-4 pb-20 h-full">
    <div class="absolute inset-0 bg-[#E5E7E0] opacity-60"></div>

    <div class="relative">
      <h1 class="text-center text-5xl font-bold mb-4">{data.faq.title}</h1>
      <h1 class="text-center text-lg font-semibold mb-4 w-full md:w-[80%] lg:w-[60%] mx-auto">
        {data.faq.subtitle}
      </h1>
      <section class="py-4 px-2 space-y-10 w-full md:w-[80%] mx-auto">
        {#each data.faq.questions as faq}
          <Accordion title={faq.title} content={faq.content} />
        {/each}
      </section>
    </div>
  </section>
{/if}
