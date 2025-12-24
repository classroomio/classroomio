<script>
  import { OrgLandingPage } from '$features/org';
  import { globalStore } from '$lib/utils/store/app';
  import { currentOrg } from '$lib/utils/store/org';
</script>

<OrgLandingPage orgSiteName={$globalStore.orgSiteName} org={$currentOrg} />
