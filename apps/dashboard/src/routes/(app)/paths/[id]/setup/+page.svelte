<script lang="ts">
  import { PathSetup } from '$features/learning-path';
  import { learningPathApi } from '$features/learning-path/api';
  import { Spinner } from '@cio/ui/base/spinner';

  import { resolveActivePath } from '$features/learning-path/utils/learning-path-utils';
  import { isOrgAdmin } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';

  let { data } = $props();

  const activePath = $derived(
    resolveActivePath(data.pathId, learningPathApi.currentPath, learningPathApi.paths, data.path, {
      isAdmin: $isOrgAdmin,
      userProfileId: $profile?.id
    })
  );

  const basePath = $derived(activePath ? `/paths/${activePath.id}` : `/paths/${data.pathId}`);
</script>

{#if activePath}
  <PathSetup path={activePath} {basePath} />
{:else}
  <div class="flex h-64 items-center justify-center">
    <Spinner class="ui:text-primary size-6" />
  </div>
{/if}
