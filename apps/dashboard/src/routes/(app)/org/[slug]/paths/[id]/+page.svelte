<script lang="ts">
  import { goto } from '$app/navigation';
  import { learningPathApi } from '$features/learning-path/api';
  import { getSetupSteps, getSetupProgress } from '$features/learning-path/utils/setup-steps';

  let { data } = $props();

  $effect(() => {
    const activePath = learningPathApi.currentPath || data.path;
    const basePath = `/org/${data.orgSlug}/paths/${activePath.id}`;
    const steps = getSetupSteps(activePath, basePath);
    const progress = getSetupProgress(steps);

    if (progress.percent < 100) {
      goto(`${basePath}/setup`, { replaceState: true });
    } else {
      goto(`${basePath}/courses`, { replaceState: true });
    }
  });
</script>
