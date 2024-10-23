<script lang="ts">
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

  const { org } = data;
</script>

<svelte:head>
  <title>Minimalistic Landing page</title>
</svelte:head>

{#if !data}
  <PageLoader />
{:else}
  <main class="bg-[#101720]">
    <Navigation />
    <Hero data={org} />
    <Learn data={org} />
    <Courses {data} />
    <!-- <LearningPath /> -->
    <Testimonial data={org} />
    <Faq data={org} />
    <FooterNote data={org} />
    <Footer data={org} />
  </main>
{/if}
