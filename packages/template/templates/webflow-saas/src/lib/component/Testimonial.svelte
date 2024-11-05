<script lang="ts">
  import TestimonialCard from './TestimonialCard.svelte';

  export let data;
</script>

{#if data.testimonial.show}
  <section id="testimonial" class="px-4 lg:px-5 pt-4 pb-20 h-full">
    <h1 class="text-start text-3xl font-bold mb-4">Testimonial</h1>
    <section class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 place-items-center gap-4">
      {#each data.testimonial.list as item, i}
        <TestimonialCard description={item.description} name={item.name} index={i} />
      {/each}
    </section>
  </section>
{/if}
