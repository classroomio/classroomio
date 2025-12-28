<script>
  import { course } from '$features/course/store';
  import UnlockedCertificate from './unlocked-certificate.svelte';
  import LockedCertificate from './locked-certificate.svelte';
</script>

<div>
  {#if $course.is_certificate_downloadable == true}
    <UnlockedCertificate />
  {:else}
    <LockedCertificate />
  {/if}
</div>
