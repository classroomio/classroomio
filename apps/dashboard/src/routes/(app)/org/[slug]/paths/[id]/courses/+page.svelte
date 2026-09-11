<script lang="ts">
  import { PathBuilder } from '$features/learning-path';
  import { learningPathApi } from '$features/learning-path/api';

  let { data } = $props();

  const activePath = $derived(learningPathApi.currentPath || data.path);
  const basePath = $derived(`/org/${data.orgSlug}/paths/${activePath.id}`);
</script>

<PathBuilder path={activePath} {basePath} />
