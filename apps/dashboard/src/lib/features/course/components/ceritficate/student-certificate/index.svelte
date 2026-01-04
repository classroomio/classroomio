<script>
  import { courseApi } from '$features/course/api';
  import UnlockedCertificate from './unlocked-certificate.svelte';
  import LockedCertificate from './locked-certificate.svelte';
</script>

<div>
  {#if courseApi.course?.isCertificateDownloadable === true}
    <UnlockedCertificate />
  {:else}
    <LockedCertificate />
  {/if}
</div>
