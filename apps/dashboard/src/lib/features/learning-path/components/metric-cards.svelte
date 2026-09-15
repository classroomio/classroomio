<script lang="ts">
  import { KpiCard } from '$features/analytics';
  import UsersIcon from '@lucide/svelte/icons/users';
  import AwardIcon from '@lucide/svelte/icons/award';
  import GitForkIcon from '@lucide/svelte/icons/git-fork';
  import PercentIcon from '@lucide/svelte/icons/percent';
  import { t } from '$lib/utils/functions/translations';
  import type { LearningPathMetrics } from '../utils/types';

  interface Props {
    metrics: LearningPathMetrics;
  }

  let { metrics }: Props = $props();
</script>

<div class="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
  <KpiCard
    title={$t('learningPath.listing.overview.active_paths')}
    value={metrics.activePaths.toLocaleString()}
    icon={GitForkIcon}
    accent="primary"
  />

  <KpiCard
    title={$t('learningPath.listing.overview.enrolled_learners')}
    value={metrics.enrolledLearners.toLocaleString()}
    icon={UsersIcon}
    accent="primary"
  />

  <KpiCard
    title={$t('learningPath.listing.overview.completions')}
    value={metrics.completions.toLocaleString()}
    icon={AwardIcon}
    accent="success"
  />

  <KpiCard
    title={$t('learningPath.listing.overview.completion_rate')}
    value={`${metrics.completionRate}%`}
    description={$t('learningPath.listing.overview.across_all_paths')}
    icon={PercentIcon}
    accent="success"
  />
</div>
