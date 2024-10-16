<script>
  import TestimonialCard from './TestimonialCard.svelte';
</script>

<section id="testimonial" class="px-4 pt-4 pb-20 h-full bg-white">
  <h1 class="text-center text-3xl font-bold mb-4">Student testimonial</h1>
  <div class="w-full md:w-[90%] mx-auto">
    <section
      class="flex flex-wrap items-center justify-center md:justify-start gap-4 p-2 w-fit mx-auto"
    >
      <TestimonialCard />
      <TestimonialCard />
      <TestimonialCard />
    </section>
  </div>
</section>
