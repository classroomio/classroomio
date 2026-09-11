<script lang="ts">
  import { PathsListing } from '$features/learning-path';
  import { learningPathApi } from '$features/learning-path/api';

  let { data } = $props();

  $effect(() => {
    if (data.paths && data.paths.length > 0 && learningPathApi.paths.length === 0) {
      learningPathApi.paths = [...data.paths];
      learningPathApi.recomputeMetrics();
    }
  });

  const basePath = $derived(`/org/${data.orgSlug}/paths`);
</script>

<svelte:head>
  <title>Learning Paths - ClassroomIO</title>
</svelte:head>

<PathsListing {basePath} orgSlug={data.orgSlug} />
