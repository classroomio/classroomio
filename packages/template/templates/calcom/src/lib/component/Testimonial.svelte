<script lang="ts">
  import TestimonialCard from './TestimonialCard.svelte';
  export let data;
</script>

{#if data.testimonial.show}
  <section id="testimonial" class="bg-[#F4F4F4] px-4 lg:p-14 h-fit">
    <section class="coolumns-1 md:columns-3 space-y-6 overflow-visible">
      {#each data.testimonial.list as item}
        <div class="break-inside-avoid overflow-visible">
          <TestimonialCard description={item.description} name={item.name} role={item.role} />
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
