<script>
  import About from './component/About.svelte';
  import Courses from './component/Courses.svelte';
  import Faq from './component/FAQ.svelte';
  import Footer from './component/Footer.svelte';
  import FooterNote from './component/FooterNote.svelte';
  import Hero from './component/Hero.svelte';
  import Navigation from './component/Navigation.svelte';
  export let data;

  console.log('data in parent:', data);

  const { org} = data;
</script>

<div class="bg-[#EEEFE9] dark:bg-black dark:text-white">
  <Navigation />
  <Hero data={org} />
  <Courses {data} />
  <About data={org} />
  <Faq data={org} />
  <FooterNote data={org} />
  <Footer data={org} />
</div>
