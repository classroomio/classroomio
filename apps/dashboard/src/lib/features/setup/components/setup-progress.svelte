<script lang="ts">
  import { calculateProgress, setupProgressApi } from '../api/setup-progress.svelte';
  import type { SetupItem } from '../api/setup-progress.svelte';
  import { Skeleton } from '@cio/ui/base/skeleton';

  let { setupItems, size = 'default' } = $props<{
    setupItems?: SetupItem[];
    size?: 'small' | 'default';
  }>();

  const effectiveSetupItems = $derived(setupItems ?? setupProgressApi.progress.setup ?? []);
  const progressPercentage = $derived(calculateProgress(effectiveSetupItems));
  const isLoading = $derived(setupProgressApi.isLoading);
  const sizeClass = $derived(size === 'small' ? 'size-10' : 'size-14');
</script>

<div class="relative shrink-0">
  {#if isLoading}
    <!-- Loading skeleton - round circle -->
    <Skeleton class="{sizeClass} rounded-full" />
  {:else}
    <svg class="{sizeClass} -rotate-90" viewBox="0 0 100 100">
      <!-- Background circle -->
      <circle
        cx="50"
        cy="50"
        r="45"
        fill="none"
        stroke="currentColor"
        stroke-width="8"
        class="text-gray-200 dark:text-gray-700"
      />
      <!-- Progress circle -->
      <circle
        cx="50"
        cy="50"
        r="45"
        fill="none"
        stroke="currentColor"
        stroke-width="8"
        stroke-linecap="round"
        class="text-green-600"
        stroke-dasharray={2 * Math.PI * 45}
        stroke-dashoffset={2 * Math.PI * 45 * (1 - progressPercentage / 100)}
        style="transition: stroke-dashoffset 0.5s ease-in-out;"
      />
    </svg>
    <!-- Center text -->
    <div class="absolute inset-0 flex flex-col items-center justify-center">
      <p class={size === 'small' ? 'text-[10px]' : 'text-sm'}>{progressPercentage}%</p>
    </div>
  {/if}
</div>
