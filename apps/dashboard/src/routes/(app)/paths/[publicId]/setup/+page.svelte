<script lang="ts">
  import { PathSetup } from '$features/learning-path';
  import { learningPathApi } from '$features/learning-path/api';

  let { data } = $props();

  const activePath = $derived(learningPathApi.currentPath);
  const basePath = $derived(activePath ? `/paths/${activePath.publicId}` : `/paths/${data.publicId}`);
</script>

{#if activePath}
  <PathSetup path={activePath} {basePath} />
{/if}
