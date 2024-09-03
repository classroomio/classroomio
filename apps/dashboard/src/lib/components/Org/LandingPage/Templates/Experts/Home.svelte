<script>
  import { t } from '$lib/utils/functions/translations';
  import Courses from './Courses.svelte';
  import Faq from './Faq.svelte';
  import Footer from './Footer.svelte';
  import FooterNote from './FooterNote.svelte';
  import Hero from './Hero.svelte';
  import Learn from './Learn.svelte';
  import LearningPath from './LearningPath.svelte';
  import Navigation from './Navigation.svelte';
  import PageLoader from '$lib/components/Org/LandingPage/PageLoader.svelte';
  import Testimonial from './Testimonial.svelte';

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
