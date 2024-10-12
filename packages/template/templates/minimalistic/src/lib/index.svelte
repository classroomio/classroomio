<script>
  import Courses from './component/Courses.svelte';
  import Faq from './component/FAQ.svelte';
  import Footer from './component/Footer.svelte';
  import FooterNote from './component/FooterNote.svelte';
  import Hero from './component/Hero.svelte';
  import Learn from './component/Learn.svelte';
  import Navigation from './component/Navigation.svelte';
  import PageLoader from './component/PageLoader.svelte';
  import Testimonial from './component/Testimonial.svelte';

  export let data;
</script>

<svelte:head>
  <title>Minimalistic Landing page</title>
</svelte:head>

{#if !data}
  <PageLoader />
{:else}
  <!-- <Course {org} /> -->
  <main class="bg-[#101720]">
    <Navigation />
    <Hero data={data.data} />
    <Learn data={data.data} />
    <Courses {data} />
    <!-- <LearningPath /> -->
    <Testimonial />
    <Faq data={data.data} />
    <FooterNote data={data.data} />
    <Footer data={data.data} />
  </main>
{/if}
