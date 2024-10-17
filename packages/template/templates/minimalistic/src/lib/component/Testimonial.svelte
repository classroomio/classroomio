<script>
  import TestimonialCard from './TestimonialCard.svelte';
  export let data;
</script>

{#if data.testimonial.show}
  <section id="testimonial" class="px-4 pt-4 pb-20 h-full bg-white">
    <h1 class="text-center text-3xl font-bold mb-4">Student testimonial</h1>
    <div class="w-full md:w-[90%] mx-auto">
      <section
        class="flex flex-wrap items-center justify-center md:justify-start gap-4 p-2 w-fit mx-auto"
      >
        {#each data.testimonial.list as item}
          <TestimonialCard name={item.name} description={item.description} role={item.role} />
        {/each}
      </section>
    </div>
  </section>
{/if}
