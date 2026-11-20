<script lang="ts">
  import { page } from '$app/state';
  import { untrack } from 'svelte';
  import { t } from '$lib/utils/functions/translations';
  import { StatsPanelCard } from '$features/ui';
  import { PathAnalyticsPage } from '$features/analytics';
  import { CourseFunnel, StuckItemsList } from '$features/learning-path';
  import { learningPathApi, pathAnalyticsApi } from '$features/learning-path/api';

  const activePath = $derived(learningPathApi.currentPath);
  const pathId = $derived(activePath?.id);
  const analytics = $derived(pathAnalyticsApi.analytics);

  async function handleRefresh() {
    if (!pathId) return;

    await learningPathApi.refreshPath(page.params.publicId);
    await pathAnalyticsApi.getAnalytics(pathId);
  }

  $effect(() => {
    const activePathId = pathId;
    if (!activePathId) return;

    untrack(() => {
      void pathAnalyticsApi.getAnalytics(activePathId);
    });
  });
</script>

{#if pathId}
  <PathAnalyticsPage {pathId} pathName={activePath?.name ?? ''} onRefresh={handleRefresh}>
    {#if analytics}
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <StatsPanelCard
          class="lg:col-span-7"
          title={$t('learningPath.analytics.funnel.title')}
          description={$t('learningPath.analytics.funnel.subtitle')}
        >
          {#snippet children()}
            <CourseFunnel funnel={analytics.funnel} enrolled={analytics.summary.enrolled} />
          {/snippet}
        </StatsPanelCard>
        <StatsPanelCard
          class="lg:col-span-5"
          title={$t('learningPath.analytics.stuck.title')}
          description={$t('learningPath.analytics.stuck.subtitle')}
        >
          {#snippet children()}
            <StuckItemsList items={analytics.stuckItems} />
          {/snippet}
        </StatsPanelCard>
      </div>
    {/if}
  </PathAnalyticsPage>
{/if}
