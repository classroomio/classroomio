<script lang="ts">
  import * as Card from '@cio/ui/base/card';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import { PercentRingProgress } from '@cio/ui/custom/percent-ring-progress';
  import { t } from '$lib/utils/functions/translations';
  import type { LearningPathOverview } from '../utils/types';

  interface Props {
    overview: LearningPathOverview | null;
  }

  let { overview }: Props = $props();

  const counts = $derived([
    { key: 'active', label: $t('learning_paths.overview.active_paths'), value: overview?.activePaths ?? 0 },
    { key: 'learners', label: $t('learning_paths.overview.enrolled_learners'), value: overview?.enrolledLearners ?? 0 },
    { key: 'completions', label: $t('learning_paths.overview.completions'), value: overview?.completions ?? 0 }
  ]);
</script>

<div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
  {#each counts as count (count.key)}
    <Card.Root class="gap-1 p-4">
      <span class="ui:text-muted-foreground text-sm">{count.label}</span>
      {#if overview}
        <span class="text-2xl font-semibold">{count.value}</span>
      {:else}
        <Skeleton class="h-8 w-12" />
      {/if}
    </Card.Root>
  {/each}

  <Card.Root class="flex-row items-center justify-between gap-3 p-4">
    <span class="ui:text-muted-foreground text-sm">{$t('learning_paths.overview.completion_rate')}</span>
    {#if overview}
      <PercentRingProgress value={overview.completionRate} size="default" />
    {:else}
      <Skeleton class="size-14 rounded-full" />
    {/if}
  </Card.Root>
</div>
