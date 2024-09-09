<script>
  import { courseMetaDeta, courses } from '$lib/components/Courses/store';
  import { t } from '$lib/utils/functions/translations';
  import { getCourseBySiteName, getPathwayBySiteName } from '$lib/utils/services/org';
  import { landingPageSettings } from '$lib/components/Org/Settings/store';
  import PageLoader from '$lib/components/Org/LandingPage/PageLoader.svelte';
  import Experts from '$lib/components/Org/LandingPage/Templates/Experts/Home.svelte';
  import Home from '$lib/components/Org/LandingPage/Templates/Plain/Home.svelte';

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
  <!-- <Experts {org} /> -->
  <Home {org} {orgSiteName} />
{/if}
