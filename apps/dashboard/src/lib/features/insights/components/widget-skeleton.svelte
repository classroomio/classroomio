<script lang="ts">
  import { Skeleton } from '@cio/ui/base/skeleton';

  import type { InsightsWidget } from '../utils/types';

  interface Props {
    viz: InsightsWidget['viz'];
  }

  let { viz }: Props = $props();
</script>

{#if viz === 'table' || viz === 'matrix'}
  <div class="space-y-2" aria-hidden="true">
    {#each [0, 1, 2, 3, 4, 5] as index (index)}
      <Skeleton class="h-9 w-full" />
    {/each}
  </div>
{:else if viz === 'donut'}
  <div class="flex h-[240px] items-center gap-6" aria-hidden="true">
    <Skeleton class="size-40 rounded-full" />
    <div class="flex-1 space-y-3">
      {#each [0, 1, 2, 3] as index (index)}
        <Skeleton class="h-4 w-full" />
      {/each}
    </div>
  </div>
{:else if viz === 'hbar'}
  <div class="space-y-3" aria-hidden="true">
    {#each [0, 1, 2, 3, 4] as index (index)}
      <Skeleton class="h-6 w-full" />
    {/each}
  </div>
{:else}
  <Skeleton class="h-[240px] w-full" />
{/if}
