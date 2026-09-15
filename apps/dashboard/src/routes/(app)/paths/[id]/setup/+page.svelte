<script lang="ts">
  import { PathSetup } from '$features/learning-path';
  import { learningPathApi } from '$features/learning-path/api';
  import { Spinner } from '@cio/ui/base/spinner';

  let { data } = $props();

  const activePath = $derived.by(() => {
    if (
      learningPathApi.currentPath &&
      (learningPathApi.currentPath.id === data.pathId || learningPathApi.currentPath.slug === data.pathId)
    ) {
      return learningPathApi.currentPath;
    }
    const found = learningPathApi.paths.find((p) => p.id === data.pathId || p.slug === data.pathId);
    if (found) return found;
    return data.path || null;
  });

  const basePath = $derived(activePath ? `/paths/${activePath.id}` : `/paths/${data.pathId}`);
</script>

{#if activePath}
  <PathSetup path={activePath} {basePath} />
{:else}
  <div class="flex h-64 items-center justify-center">
    <Spinner class="ui:text-primary size-6" />
  </div>
{/if}
