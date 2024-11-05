<script lang="ts">
  import TestimonialCard from './TestimonialCard.svelte';
  export let data;
</script>

{#if data.testimonial.show}
  <section id="testimonial" class="px-4 pt-4 pb-20 h-full bg-white">
    <h1 class="text-center text-3xl font-bold mb-4">Student testimonial</h1>
    <div class="w-full md:w-[90%] mx-auto">
      <section class="grid place-items-center grid-cols-1 md:grid-cols-3 gap-4">
        {#each data.testimonial.list as item}
          <TestimonialCard name={item.name} description={item.description} role={item.role} />
        {/each}
      </section>
    </div>
  </section>
{/if}
