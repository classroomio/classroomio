<script lang="ts">
  import { PathSetup } from '$features/learning-path';
  import { learningPathApi } from '$features/learning-path/api';

  let { data } = $props();

  const activePath = $derived(learningPathApi.currentPath || data.path);
  const basePath = $derived(`/org/${data.orgSlug}/paths/${activePath.id}`);
</script>

<PathSetup path={activePath} {basePath} />
