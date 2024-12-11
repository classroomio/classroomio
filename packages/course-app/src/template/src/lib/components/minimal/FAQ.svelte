<script lang="ts">
  import { getPageSection } from '@/utils/helpers/page';
  import Accordion from './Accordion.svelte';
  import { homePage } from '@/utils/stores/pages';

  const content = $derived(getPageSection($homePage, 'faq'));
</script>

{#if content?.show}
  <section class="px-4 pt-4 pb-20 h-full bg-[#F9F9F9]">
    <h1 class="text-center text-3xl font-bold mb-4">{content.settings.title}</h1>
    <section class="p-4 space-y-10 w-full md:w-[80%] mx-auto">
      {#each content.settings.questions as faq}
        <Accordion title={faq.title} content={faq.content} />
      {/each}
    </section>
  </section>
{/if}
