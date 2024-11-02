<!-- <script lang="ts">
  import TestimonialCard from './TestimonialCard.svelte';
  export let data;
</script>

{#if data.testimonial.show}
  <section id="testimonial" class="px-4 lg:px-5 pt-4 h-fit">
    <h1 class="text-start text-3xl font-bold mb-4">Testimonial</h1>
    <section class="h-screen columns-3 gap-3 space-y-2 overflow-y-scroll">
      {#each data.testimonial.list as item}
        <TestimonialCard description={item.description} name={item.name} />
      {/each}
    </section>
  </section>
{/if} -->

<script lang="ts">
  import TestimonialCard from './TestimonialCard.svelte';
  export let data;
</script>

{#if data.testimonial.show}
  <section id="testimonial" class="px-4 lg:px-5 pt-4 h-fit">
    <h1 class="text-start text-3xl font-bold mb-4">Testimonial</h1>
    <section class="columns-3 gap-3 space-y-3 overflow-visible">
      {#each data.testimonial.list as item}
        <div class="break-inside-avoid overflow-visible">
          <TestimonialCard description={item.description} name={item.name} />
        </div>
      {/each}
    </section>
  </section>
{/if}

<style>
  .break-inside-avoid {
    break-inside: avoid;
  }
</style>
