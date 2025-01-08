<script>
  import { getPathwayCompletedCoursesLength } from '$lib/utils/functions/pathway';

  import { pathway } from '$lib/components/Pathways/store';
  import UnlockedCertificate from './UnlockedCertificate.svelte';
  import LockedCertificate from './LockedCertificate.svelte';

  const getIsPathwayComplete = () => {
    const completedCourses = getPathwayCompletedCoursesLength($pathway);
    return completedCourses === $pathway.pathway_course.length;
  };

  $: isPathwayComplete = getIsPathwayComplete();
</script>

<div>
  {#if $pathway.is_certificate_downloadable}
    <UnlockedCertificate bind:isPathwayComplete />
  {:else}
    <LockedCertificate />
  {/if}
</div>
