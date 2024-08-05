<script>
  import { pathway } from '$lib/components/Pathways/store';
  import UnlockedCertificate from './UnlockedCertificate.svelte';
  import LockedCertificate from './LockedCertificate.svelte';
</script>

<div>
  {#if $pathway.is_certificate_downloadable == true}
    <UnlockedCertificate />
  {:else}
    <LockedCertificate />
  {/if}
</div>
