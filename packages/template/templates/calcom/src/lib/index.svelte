<script lang="ts">
  import Courses from './component/Courses.svelte';
  import About from './component/About.svelte';
  import Faq from './component/FAQ.svelte';
  import Footer from './component/Footer.svelte';
  import Hero from './component/Hero.svelte';
  import Navigation from './component/Navigation.svelte';
  import Testimonial from './component/Testimonial.svelte';
  export let data;

  console.log('data in parent:', data);

  const { org } = data;
</script>

<div
  class="bg-[#EEEFE9] dark:bg-black dark:text-white bg-contain bg-center"
  style="background-image: url('calcom-background.svg');"
>
  <Navigation />
  <Hero data={org} />
  <Courses {data} />
  <About data={org} />
  <Faq data={org} />
  <Testimonial data={org} />
  <Footer data={org} />
</div>
