<script>
  import Navigation from '$lib/components/Org/LandingPage/Templates/Prep/components/Navigation.svelte';
  import PageLoader from '$lib/components/Org/LandingPage/PageLoader.svelte';
  import { t } from '$lib/utils/functions/translations';
  import Hero from '$lib/components/Org/LandingPage/Templates/Prep/components/Hero.svelte';

  import Courses from '$lib/components/Org/LandingPage/Templates/Prep/components/Courses.svelte';

  import AboutUs from '$lib/components/Org/LandingPage/Templates/Prep/components/About.svelte';
  import LearningPath from '$lib/components/Org/LandingPage/Templates/Prep/components/LearningPath.svelte';
  import FAQ from '$lib/components/Org/LandingPage/Templates/Prep/components/FAQ.svelte';
  import Testimonial from '$lib/components/Org/LandingPage/Templates/Prep/components/Testimonial.svelte';
  import FooterNote from '$lib/components/Org/LandingPage/Templates/Prep/components/FooterNote.svelte';
  import Footer from '$lib/components/Org/LandingPage/Templates/Prep/components/Footer.svelte';
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
    <Testimonial />
    <Courses />
    <AboutUs />
    <LearningPath />
    <FAQ />
    <FooterNote />
    <Footer logo={org.avatar_url} orgName={org.name} />
  </main> -->
{/if}
