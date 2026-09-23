<script lang="ts">
  import AwardIcon from '@lucide/svelte/icons/award';
  import ClockIcon from '@lucide/svelte/icons/clock';
  import PlayIcon from '@lucide/svelte/icons/play';
  import UsersIcon from '@lucide/svelte/icons/users';
  import { KpiCard } from '$features/analytics';
  import { t } from '$lib/utils/functions/translations';
  import type { PathAnalyticsSummary } from '../../utils/types';
  import { formatAvgTime } from '../../utils/analytics-utils';

  interface Props {
    summary: PathAnalyticsSummary;
  }

  let { summary }: Props = $props();
</script>

<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
  <KpiCard
    title={$t('learningPath.analytics.stat.enrolled')}
    value={summary.enrolled.toLocaleString()}
    description={$t('learningPath.analytics.stat.enrolled_desc', { count: summary.newThisMonth })}
    descriptionSecondary={$t('learningPath.analytics.stat.team_desc', { count: summary.tutorsCount })}
    icon={UsersIcon}
    accent="primary"
  />
  <KpiCard
    title={$t('learningPath.analytics.stat.active')}
    value={summary.activeLearners.toLocaleString()}
    description={$t('learningPath.analytics.stat.active_desc')}
    icon={PlayIcon}
    accent="success"
  />
  <KpiCard
    title={$t('learningPath.analytics.stat.completion_rate')}
    value={`${summary.completionRate}%`}
    description={$t('learningPath.analytics.stat.completion_desc', {
      completed: summary.completedCount,
      total: summary.enrolled
    })}
    icon={AwardIcon}
    accent="warning"
  />
  <KpiCard
    title={$t('learningPath.analytics.stat.avg_time')}
    value={formatAvgTime(summary.avgTimeToFinishDays)}
    description={$t('learningPath.analytics.stat.avg_time_desc')}
    icon={ClockIcon}
    accent="primary"
  />
</div>
