<script lang="ts">
  import { calculateProgress, setupProgressApi } from '../api/setup-progress.svelte';
  import type { SetupItem } from '../api/setup-progress.svelte';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import { PercentRingProgress } from '@cio/ui/custom/percent-ring-progress';

  let { setupItems, size = 'default' } = $props<{
    setupItems?: SetupItem[];
    size?: 'small' | 'default';
  }>();

  const effectiveSetupItems = $derived(setupItems ?? setupProgressApi.progress.setup ?? []);
  const progressPercentage = $derived(calculateProgress(effectiveSetupItems));
  const isLoading = $derived(setupProgressApi.isLoading);
  const sizeClass = $derived(size === 'small' ? 'size-10' : 'size-14');
</script>

{#if isLoading}
  <Skeleton class="{sizeClass} shrink-0 rounded-full" />
{:else}
  <PercentRingProgress value={progressPercentage} {size} />
{/if}
