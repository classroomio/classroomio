<script lang="ts">
  import { PathCoursesPage, PathHubPlaceholder } from '$features/learning-path';
  import { pathJourneyApi } from '$features/lms/api';
  import { getPathViewContext } from '$features/learning-path/utils/path-view-context';

  let { data } = $props();

  const viewContext = getPathViewContext();
  const mode = $derived(viewContext.getMode());
</script>

{#if mode === 'learner'}
  <PathHubPlaceholder pathName={pathJourneyApi.journey?.path.name ?? ''} />
{:else}
  <PathCoursesPage publicId={data.publicId} />
{/if}
