<script lang="ts">
  import { goto } from '$app/navigation';
  import { learningPathApi } from '$features/learning-path/api';
  import { getSetupSteps, getSetupProgress } from '$features/learning-path/utils/setup-steps';
  import { Spinner } from '@cio/ui/base/spinner';

  let { data } = $props();

  $effect(() => {
    const activePath =
      learningPathApi.currentPath?.id === data.pathId
        ? learningPathApi.currentPath
        : learningPathApi.paths.find((p) => p.id === data.pathId || p.slug === data.pathId) || data.path || null;

    if (!activePath) {
      goto(`/paths/${data.pathId}/courses`, { replaceState: true });
      return;
    }

    const basePath = `/paths/${activePath.id}`;
    const steps = getSetupSteps(activePath, basePath);
    const progress = getSetupProgress(steps);

    if (progress.percent < 100) {
      goto(`${basePath}/setup`, { replaceState: true });
    } else {
      goto(`${basePath}/courses`, { replaceState: true });
    }
  });
</script>

<div class="flex h-64 items-center justify-center">
  <Spinner class="ui:text-primary size-6" />
</div>
