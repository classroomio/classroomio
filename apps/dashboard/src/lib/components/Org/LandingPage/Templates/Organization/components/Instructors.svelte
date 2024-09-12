<script>
  import InstructorCard from './InstructorCard.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
</script>

<section id="testimonial" class="px-4 lg:px-14 pt-4 pb-20 h-full bg-white">
  <h1 class="text-center lg:text-start text-3xl text-[#3F3F3F]">Meet some of our Instructors</h1>
  <section class="flex flex-wrap items-center justify-center lg:justify-start gap-6 py-4">
    <InstructorCard />
    <InstructorCard />
    <InstructorCard />
  </section>
  <div class="w-full flex justify-center md:justify-end px-4 mt-6">
    <PrimaryButton
      label="Start learning & Explore courses"
      variant={VARIANTS.NONE}
      className="text-lg font-semibold text-white !bg-[#CE02CE] rounded-none"
    />
  </div>
</section>
