<script lang="ts">
  import { getPageSection } from '@/utils/helpers/page';
  import TestimonialCard from './TestimonialCard.svelte';
  import { homePage } from '@/utils/stores/pages';

  const content = $derived(getPageSection($homePage, 'testimonial'));
</script>

{#if content?.show}
  <section id="testimonial" class="px-4 lg:px-14 pt-4 pb-20 h-full bg-white">
    <h1 class="text-center text-3xl text-[#3F3F3F] font-bold mb-4">Words from our past learners</h1>
    <section class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 w-full">
      {#each content.settings.list as item}
        <TestimonialCard description={item.description} name={item.name} />
      {/each}
    </section>
  </section>
{/if}
