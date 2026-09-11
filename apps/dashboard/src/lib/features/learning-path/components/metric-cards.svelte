<script lang="ts">
  import * as Card from '@cio/ui/base/card';
  import { PercentRingProgress } from '@cio/ui/custom/percent-ring-progress';
  import UsersIcon from '@lucide/svelte/icons/users';
  import AwardIcon from '@lucide/svelte/icons/award';
  import GitForkIcon from '@lucide/svelte/icons/git-fork';
  import { t } from '$lib/utils/functions/translations';
  import type { LearningPathMetrics } from '../utils/types';

  interface Props {
    metrics: LearningPathMetrics;
  }

  let { metrics }: Props = $props();
</script>

<div class="mb-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
  <Card.Root class="border-border bg-card flex items-center gap-3.5 border p-4">
    <div class="bg-primary/10 text-primary flex size-9.5 shrink-0 items-center justify-center rounded-md">
      <GitForkIcon class="size-4.5" />
    </div>
    <div>
      <div class="text-muted-foreground text-[12.5px] font-medium">
        {$t('learningPath.listing.overview.active_paths')}
      </div>
      <div class="text-foreground mt-0.5 text-[22px] font-semibold tracking-tight tabular-nums">
        {metrics.activePaths}
      </div>
    </div>
  </Card.Root>

  <Card.Root class="border-border bg-card flex items-center gap-3.5 border p-4">
    <div class="bg-primary/10 text-primary flex size-9.5 shrink-0 items-center justify-center rounded-md">
      <UsersIcon class="size-4.5" />
    </div>
    <div>
      <div class="text-muted-foreground text-[12.5px] font-medium">
        {$t('learningPath.listing.overview.enrolled_learners')}
      </div>
      <div class="text-foreground mt-0.5 text-[22px] font-semibold tracking-tight tabular-nums">
        {metrics.enrolledLearners}
      </div>
    </div>
  </Card.Root>

  <Card.Root class="border-border bg-card flex items-center gap-3.5 border p-4">
    <div
      class="flex size-9.5 shrink-0 items-center justify-center rounded-md bg-green-500/15 text-green-600 dark:text-green-500"
    >
      <AwardIcon class="size-4.5" />
    </div>
    <div>
      <div class="text-muted-foreground text-[12.5px] font-medium">
        {$t('learningPath.listing.overview.completions')}
      </div>
      <div class="text-foreground mt-0.5 text-[22px] font-semibold tracking-tight tabular-nums">
        {metrics.completions}
      </div>
    </div>
  </Card.Root>

  <Card.Root class="border-border bg-card flex items-center gap-3.5 border p-4">
    <div class="shrink-0">
      <PercentRingProgress value={metrics.completionRate} size="default" />
    </div>
    <div>
      <div class="text-muted-foreground text-[12.5px] font-medium">
        {$t('learningPath.listing.overview.completion_rate')}
      </div>
      <div class="text-muted-foreground mt-1 text-[13px] font-medium">
        {$t('learningPath.listing.overview.across_all_paths')}
      </div>
    </div>
  </Card.Root>
</div>
