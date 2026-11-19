<script lang="ts">
  import { goto } from '$app/navigation';
  import { PathCoursesPage, PathHubPlaceholder } from '$features/learning-path';
  import { pathJourneyApi } from '$features/lms/api';
  import { getPathViewContext } from '$features/learning-path/utils/path-view-context';

  let { data } = $props();

  const viewContext = getPathViewContext();
  const mode = $derived(viewContext.getMode());

  $effect(() => {
    if (mode !== 'learner') return;
    goto(`/lms/paths/${data.publicId}`, { replaceState: true });
  });
</script>

{#if mode === 'learner'}
  <PathHubPlaceholder pathName={pathJourneyApi.journey?.path.name ?? ''} />
{:else}
  <PathCoursesPage publicId={data.publicId} />
{/if}
