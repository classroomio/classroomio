<script>
  import OrgLandingPage from '$lib/components/Org/LandingPage/index.svelte';
  import { globalStore } from '$lib/utils/store/app';
  import { currentOrg } from '$lib/utils/store/org';
</script>

<OrgLandingPage orgSiteName={$globalStore.orgSiteName} org={$currentOrg} />
