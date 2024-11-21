<script lang="ts">
  import Courses from './components/Courses.svelte';
  import About from './components/About.svelte';
  import Faq from './components/FAQ.svelte';
  import Footer from './components/Footer.svelte';
  import Hero from './components/Hero.svelte';
  import Navigation from './components/Navigation.svelte';
  import Testimonial from './components/Testimonial.svelte';
  import FooterNote from './components/FooterNote.svelte';
  import type { CourseMetadata, LandingPageContent } from './utils/types';

  interface Data {
    org: LandingPageContent;
    courses: { data: CourseMetadata; lessons: number }[];
  }

  interface Props {
    data: Data;
  }

  let { data }: Props = $props();

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
