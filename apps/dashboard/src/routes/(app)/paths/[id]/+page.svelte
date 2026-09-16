<script lang="ts">
  import { goto } from '$app/navigation';
  import { learningPathApi } from '$features/learning-path/api';
  import { getSetupSteps, getSetupProgress } from '$features/learning-path/utils/setup-steps';
  import { resolveActivePath } from '$features/learning-path/utils/learning-path-utils';
  import { Spinner } from '@cio/ui/base/spinner';
  import { isOrgAdmin } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';

  let { data } = $props();

  $effect(() => {
    const activePath = resolveActivePath(data.pathId, learningPathApi.currentPath, learningPathApi.paths, data.path, {
      isAdmin: $isOrgAdmin,
      userProfileId: $profile?.id
    });

    if (!activePath) {
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
