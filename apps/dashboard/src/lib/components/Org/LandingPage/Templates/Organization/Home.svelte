<script>
  import Navigation from '$lib/components/Org/LandingPage/Templates/Organization/components/Navigation.svelte';
  import PageLoader from '$lib/components/Org/LandingPage/PageLoader.svelte';
  import { t } from '$lib/utils/functions/translations';
  import Hero from '$lib/components/Org/LandingPage/Templates/Organization/components/Hero.svelte';
  import About from './components/About.svelte';
  import Courses from './components/Courses.svelte';
  import Instructors from './components/Instructors.svelte';
  import Faq from './components/Faq.svelte';
  import Footer from './components/Footer.svelte';
  import Testimonial from './components/Testimonials.svelte';
  import FooterNote from './components/FooterNote.svelte';
  import Blog from './components/Blog.svelte';
  import Course from './Course.svelte';

  export let org = {};
</script>

<svelte:head>
  <title>
    {!org.name ? '' : `${org.name}'s `}{$t('course.navItem.landing_page.landing_page')}
  </title>
</svelte:head>

{#if !org.landingpage}
  <PageLoader />
{:else}
  <Course {org} />
  <!-- <main>
    <Navigation logo={org.avatar_url} orgName={org.name} disableSignup={true} isOrgSite={true} />
    <Hero />
    <About />
    <Courses />
    <Instructors />
    <Faq />
    <Testimonial />
    <FooterNote />
    <Blog />
    <Footer logo={org.avatar_url} orgName={org.name} />
  </main> -->
{/if}
