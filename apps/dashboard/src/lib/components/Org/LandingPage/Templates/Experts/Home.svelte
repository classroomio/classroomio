<script>
  import { t } from '$lib/utils/functions/translations';
  import Courses from '$lib/components/Org/LandingPage/Templates/Experts/components/Courses.svelte';
  import Faq from '$lib/components/Org/LandingPage/Templates/Experts/components/Faq.svelte';
  import Footer from '$lib/components/Org/LandingPage/Templates/Experts/components/Footer.svelte';
  import FooterNote from '$lib/components/Org/LandingPage/Templates/Experts/components/FooterNote.svelte';
  import Hero from '$lib/components/Org/LandingPage/Templates/Experts/components/Hero.svelte';
  import Learn from '$lib/components/Org/LandingPage/Templates/Experts/components/Learn.svelte';
  import LearningPath from '$lib/components/Org/LandingPage/Templates/Experts/components/LearningPath.svelte';
  import Navigation from '$lib/components/Org/LandingPage/Templates/Experts/components/Navigation.svelte';
  import PageLoader from '$lib/components/Org/LandingPage/PageLoader.svelte';
  import Testimonial from '$lib/components/Org/LandingPage/Templates/Experts/components/Testimonial.svelte';

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
  <main class="bg-[#101720]">
    <Navigation logo={org.avatar_url} orgName={org.name} disableSignup={true} isOrgSite={true} />
    <Hero />
    <Learn />
    <Courses />
    <LearningPath />
    <Testimonial />
    <Faq />
    <FooterNote />
    <Footer logo={org.avatar_url} orgName={org.name} />
  </main>
{/if}
