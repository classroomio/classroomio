<script>
  import Navigation from '$lib/components/Org/LandingPage/Templates/Bootcamp/components/Navigation.svelte';
  import PageLoader from '$lib/components/Org/LandingPage/PageLoader.svelte';
  import { t } from '$lib/utils/functions/translations';
  import Hero from './components/Hero.svelte';
  import AboutUs from './components/AboutUs.svelte';
  import Courses from './components/Courses.svelte';
  import LearningPath from './components/LearningPath.svelte';
  import Testimonial from './components/Testimonial.svelte';
  import FooterNote from './components/FooterNote.svelte';
  import Footer from './components/Footer.svelte';

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
  <!-- <Course {org} /> -->
  <main class="bg-[#101720]">
    <Navigation logo={org.avatar_url} orgName={org.name} disableSignup={true} isOrgSite={true} />
    <Hero />
    <AboutUs />
    <Courses />
    <LearningPath />
    <Testimonial />
    <FooterNote />
    <Footer logo={org.avatar_url} orgName={org.name} />
  </main>
{/if}
