<script>
  import Navigation from '$lib/components/Org/LandingPage/Templates/Organization/components/Navigation.svelte';
  import PageLoader from '$lib/components/Org/LandingPage/PageLoader.svelte';
  import { t } from '$lib/utils/functions/translations';

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
  </main>
{/if}
