<script>
  import About from './component/About.svelte';
  import Blog from './component/Blog.svelte';
  import Courses from './component/Courses.svelte';
  import Faq from './component/FAQ.svelte';
  import Footer from './component/Footer.svelte';
  import FooterNote from './component/FooterNote.svelte';
  import Hero from './component/Hero.svelte';
  import Instructors from './component/Instructors.svelte';
  import Navigation from './component/Navigation.svelte';
  import PageLoader from './component/PageLoader.svelte';
  import Testimonial from './component/Testimonial.svelte';

  export let data;

  const { org, courses } = data;
</script>

<svelte:head>
  <title>Classic landing page</title>
</svelte:head>

{#if !data}
  <!-- <PageLoader /> -->
  <p>loading</p>
{:else}
  <!-- <Course {org} /> -->
  <main>
    <Navigation />
    <Hero data={org} />
    <About data={org} />
    <Courses {data} />
    <Instructors />
    <Faq data={org} />
    <Testimonial />
    <FooterNote data={org} />
    <Blog />
    <Footer data={org} />
  </main>
{/if}
