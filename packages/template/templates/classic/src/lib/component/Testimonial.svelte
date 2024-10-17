<script>
  import TestimonialCard from './TestimonialCard.svelte';

  export let data;
</script>

{#if data.testimonial.show}
  <section id="testimonial" class="px-4 lg:px-14 pt-4 pb-20 h-full bg-white">
    <h1 class="text-center text-3xl text-[#3F3F3F] font-bold mb-4">Words from our past learners</h1>
    <section class="flex flex-wrap items-center justify-center gap-4 p-4 w-full mx-auto">
      {#each data.testimonial.list as item}
        <TestimonialCard description={item.description} name={item.name} />
      {/each}
    </section>
  </section>
{/if}
