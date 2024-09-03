<script>
  import { courseMetaDeta, courses } from '$lib/components/Courses/store';
  import { t } from '$lib/utils/functions/translations';
  import { getCourseBySiteName, getPathwayBySiteName } from '$lib/utils/services/org';
  import { landingPageSettings } from '../Settings/store';
  import Courses from './Courses.svelte';
  import Faq from './Faq.svelte';
  import Footer from './Footer.svelte';
  import FooterNote from './FooterNote.svelte';
  import Hero from './Hero.svelte';
  import Learn from './Learn.svelte';
  import LearningPath from './LearningPath.svelte';
  import Navigation from './Navigation.svelte';
  import PageLoader from './PageLoader.svelte';
  import Testimonial from './Testimonial.svelte';

  export let orgSiteName = '';
  export let org = {};

  $: loadData(orgSiteName);

  async function loadData(siteName) {
    if (!siteName) return;

    try {
      console.log('sitename', siteName);
      $courseMetaDeta.isLoading = true;

      const coursesResult = await getCourseBySiteName(siteName);
      // const pathwayResult = await getPathwayBySiteName(siteName)
      courses.set(coursesResult);
      // pathways.set(pathwayResult)
      $courseMetaDeta.isLoading = false;
    } catch (error) {
      console.log('error', error);
    }
  }

  function setDefault(landingpage) {
    if (landingpage && Object.keys(landingpage).length) {
      if (!landingpage?.header?.banner) {
        landingpage.header.banner = $landingPageSettings.header.banner;
      }

      $landingPageSettings = {
        ...landingpage
      };
    }
  }

  // $: initPlyr(player, $landingPageSettings.header?.banner?.video);
  $: setDefault(org.landingpage);
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
