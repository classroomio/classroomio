<script>
  import { course } from '$lib/components/Course/store';
  import UnlockedCertificate from './UnlockedCertificate.svelte';
  import LockedCertificate from './LockedCertificate.svelte';
</script>

<div>
  {#if $course.is_certificate_downloadable == true}
    <UnlockedCertificate />
  {:else}
    <LockedCertificate />
  {/if}
</div>
