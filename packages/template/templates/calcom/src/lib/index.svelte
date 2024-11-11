<script lang="ts">
  import Courses from './component/Courses.svelte';
  import About from './component/About.svelte';
  import Faq from './component/FAQ.svelte';
  import Footer from './component/Footer.svelte';
  import Hero from './component/Hero.svelte';
  import Navigation from './component/Navigation.svelte';
  import Testimonial from './component/Testimonial.svelte';
  import FooterNote from './component/FooterNote.svelte';
  import type { CourseMetadata, LandingPageContent } from './utils/types';

  interface Data {
    org: LandingPageContent;
    courses: { data: CourseMetadata; lessons: number }[];
  }

  export let data: Data;

  const { org } = data;
</script>

<div
  class="bg-[#EEEFE9] dark:bg-black dark:text-white bg-contain bg-center overflow-hidden"
  style="background-image: url('calcom-background.svg');"
>
  <Navigation />
  <Hero data={org} />
  <Courses {data} />
  <About data={org} />
  <Faq data={org} />
  <Testimonial data={org} />
  <FooterNote data={org} />
  <Footer data={org} />
</div>
