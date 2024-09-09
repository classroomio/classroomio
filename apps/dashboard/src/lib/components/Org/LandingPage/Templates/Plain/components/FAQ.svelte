<script>
  import { landingPageSettings } from '$lib/components/Org/Settings/store';
  import { fade } from 'svelte/transition';
  import { Accordion, AccordionItem, Grid, Row, Column } from 'carbon-components-svelte';
</script>

{#if $landingPageSettings.faq.show}
  <section id="faq" transition:fade class="my-10 mx-auto max-w-[700px] w-full">
    <div class="py-10">
      <h1 class="text-4xl md:text-5xl lg:text-6xl text-center my-4 font-bold">
        {$landingPageSettings.faq.title}
      </h1>
    </div>
    <div class="mx-2">
      <Accordion size="xl">
        {#each $landingPageSettings.faq.questions as faq}
          <AccordionItem title={faq.title} class="text-3xl">
            <p class="text-lg">
              {faq.content}
            </p>
          </AccordionItem>
        {/each}
      </Accordion>
    </div>
  </section>
{/if}
