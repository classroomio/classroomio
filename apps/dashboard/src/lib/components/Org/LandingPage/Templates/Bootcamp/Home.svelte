<script>
  import Navigation from '$lib/components/Org/LandingPage/Templates/Bootcamp/components/Navigation.svelte';
  import PageLoader from '$lib/components/Org/LandingPage/PageLoader.svelte';
  import { t } from '$lib/utils/functions/translations';
  import Hero from '$lib/components/Org/LandingPage/Templates/Bootcamp/components/Hero.svelte';
  import AboutUs from '$lib/components/Org/LandingPage/Templates/Bootcamp/components/AboutUs.svelte';
  import Courses from '$lib/components/Org/LandingPage/Templates/Bootcamp/components/Courses.svelte';
  import LearningPath from '$lib/components/Org/LandingPage/Templates/Bootcamp/components/LearningPath.svelte';
  import Testimonial from '$lib/components/Org/LandingPage/Templates/Bootcamp/components/Testimonial.svelte';
  import FooterNote from '$lib/components/Org/LandingPage/Templates/Bootcamp/components/FooterNote.svelte';
  import Footer from '$lib/components/Org/LandingPage/Templates/Bootcamp/components/Footer.svelte';
  import Course from '$lib/components/Org/LandingPage/Templates/Bootcamp/Course.svelte';

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
