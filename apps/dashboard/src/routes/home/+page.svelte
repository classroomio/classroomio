<script>
  import OrgLandingPage from '$lib/components/Org/LandingPage/index.svelte';
  import { currentOrg } from '$lib/utils/store/org';
</script>

<OrgLandingPage orgSiteName={$currentOrg.siteName} org={$currentOrg} />
