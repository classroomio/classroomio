<script>
  import Navigation from '$lib/components/Org/LandingPage/Templates/Posthog/components/Navigation.svelte';
  import PageLoader from '$lib/components/Org/LandingPage/PageLoader.svelte';
  import { t } from '$lib/utils/functions/translations';
  import Hero from '$lib/components/Org/LandingPage/Templates/Posthog/components/Hero.svelte';
  import Courses from '$lib/components/Org/LandingPage/Templates/Posthog/components/Courses.svelte';
  import AboutUs from '$lib/components/Org/LandingPage/Templates/Posthog/components/About.svelte';
  import FAQ from '$lib/components/Org/LandingPage/Templates/Posthog/components/FAQ.svelte';
  import FooterNote from '$lib/components/Org/LandingPage/Templates/Posthog/components/FooterNote.svelte';
  import Footer from '$lib/components/Org/LandingPage/Templates/Posthog/components/Footer.svelte';
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
  <!-- <Course {org} /> -->
  <main class="bg-[#EEEFE9] dark:bg-black">
    <Navigation logo={org.avatar_url} orgName={org.name} disableSignup={true} isOrgSite={true} />
    <Hero />
    <Courses />
    <AboutUs />
    <FAQ />
    <FooterNote />
    <Footer logo={org.avatar_url} orgName={org.name} />
  </main>
{/if}
