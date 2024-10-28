<script lang="ts">
  import Courses from './component/Courses.svelte';
  import Faq from './component/FAQ.svelte';
  import Footer from './component/Footer.svelte';
  import Hero from './component/Hero.svelte';
  import Navigation from './component/Navigation.svelte';
  import Testimonial from './component/Testimonial.svelte';
  export let data;

  console.log('data in parent:', data);

  const { org } = data;
</script>

<div class="bg-[#EEEFE9] dark:bg-black dark:text-white py-4 px-2">
  <div class="flex items-start">
    <div class="lg:sticky top-2 left-0 lg:w-fit z-50">
      <Navigation />
    </div>
    <div class="w-full">
      <Hero data={org} />
      <Courses {data} />
      <Faq data={org} />
      <Testimonial data={org} />
    </div>
  </div>
  <Footer data={org} />
</div>
