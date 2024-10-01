<script>
  import { landingPageSettings } from '$lib/components/Org/Settings/store';
  import Accordion from '$lib/components/Org/LandingPage/components/Accordion.svelte';
</script>

{#if $landingPageSettings.faq.show}
  <section class="px-4 pt-4 pb-20 h-full bg-[#F9F9F9]">
    <h1 class="text-center text-3xl">{$landingPageSettings.faq.title}</h1>
    <section class="p-4 space-y-10 w-full md:w-[80%] mx-auto">
      {#each $landingPageSettings.faq.questions as faq}
        <Accordion title={faq.title} content={faq.content} />
      {/each}
    </section>
  </section>
{/if}
