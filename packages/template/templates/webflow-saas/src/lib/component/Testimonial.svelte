<script lang="ts">
  import TestimonialCard from './TestimonialCard.svelte';

  export let data;
</script>

{#if data.testimonial.show}
  <section id="testimonial" class="px-4 lg:px-5 pt-4 pb-20 h-full">
    <h1 class="text-start text-3xl font-bold mb-4">Testimonial</h1>
    <section
      class="flex flex-wrap items-center justify-center md:justify-start gap-4 py-4 w-fit mx-auto"
    >
      {#each data.testimonial.list as item}
        <TestimonialCard description={item.description} name={item.name} />
      {/each}
    </section>
  </section>
{/if}
