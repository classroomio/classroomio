<script lang="ts">
  import { PathSetup } from '$features/learning-path';
  import { learningPathApi } from '$features/learning-path/api';

  import { resolveActivePath } from '$features/learning-path/utils/learning-path-utils';
  import { isOrgAdmin } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';

  let { data } = $props();

  const activePath = $derived(
    resolveActivePath(data.publicId, learningPathApi.currentPath, learningPathApi.paths, data.path, {
      isAdmin: $isOrgAdmin,
      userProfileId: $profile?.id
    })
  );

  const basePath = $derived(activePath ? `/paths/${activePath.publicId}` : `/paths/${data.publicId}`);
</script>

{#if activePath}
  <PathSetup path={activePath} {basePath} />
{/if}
