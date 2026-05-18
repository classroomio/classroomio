<script lang="ts">
  import { t } from '$lib/utils/functions/translations';
  import EyeIcon from '@lucide/svelte/icons/eye';
  import UsersIcon from '@lucide/svelte/icons/users';
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import UserPlusIcon from '@lucide/svelte/icons/user-plus';
  import KpiCard from './kpi-card.svelte';
  import type { LandingStatsData } from '../utils/types';

  interface Props {
    data: LandingStatsData | null;
    loading?: boolean;
  }

  let { data, loading = false }: Props = $props();

  const totals = $derived(
    data?.totals ?? {
      landingViews: 0,
      coursePageViews: 0,
      uniqueVisitors: 0,
      enrollments: 0,
      completions: 0
    }
  );

  const viewSpark = $derived(data?.sparkline.map((row) => row.views) ?? []);
  const enrollSpark = $derived(data?.sparkline.map((row) => row.enrollments) ?? []);
</script>

<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
  <KpiCard
    title={$t('analytics.kpi.landing_views')}
    value={totals.landingViews.toLocaleString()}
    description={$t('analytics.kpi.range_description')}
    loading={loading && !data}
    icon={EyeIcon}
    accent="primary"
    sparkline={viewSpark}
  />
  <KpiCard
    title={$t('analytics.kpi.unique_visitors')}
    value={totals.uniqueVisitors.toLocaleString()}
    description={$t('analytics.kpi.range_description')}
    loading={loading && !data}
    icon={UsersIcon}
    accent="success"
  />
  <KpiCard
    title={$t('analytics.kpi.course_page_views')}
    value={totals.coursePageViews.toLocaleString()}
    description={$t('analytics.kpi.range_description')}
    loading={loading && !data}
    icon={BookOpenIcon}
    accent="warning"
  />
  <KpiCard
    title={$t('analytics.kpi.enrollments')}
    value={totals.enrollments.toLocaleString()}
    description={$t('analytics.kpi.range_description')}
    loading={loading && !data}
    icon={UserPlusIcon}
    accent="primary"
    sparkline={enrollSpark}
  />
</div>
