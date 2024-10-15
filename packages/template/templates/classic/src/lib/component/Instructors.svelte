<script>
  import Button from '$lib/components/ui/button/button.svelte';
  import InstructorCard from './InstructorsCard.svelte';
</script>

<section class="px-4 lg:px-14 pt-4 pb-20 h-full bg-white">
  <h1 class="text-center lg:text-start text-3xl text-[#3F3F3F] font-bold mb-4">
    Meet some of our Instructors
  </h1>
  <section class="flex flex-wrap items-center justify-center lg:justify-start gap-6 py-4">
    <InstructorCard />
    <InstructorCard />
    <InstructorCard />
  </section>
  <div class="w-full flex justify-center md:justify-end px-4 mt-6">
    <Button
      class="text-lg font-semibold text-white bg-[#CE02CE] hover:bg-[#CE02CE] hover:scale-90 py-6 px-6 rounded"
      >Start learning & Explore courses</Button
    >
  </div>
</section>
