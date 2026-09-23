<script lang="ts">
  import { untrack } from 'svelte';
  import { page } from '$app/state';
  import { fade } from 'svelte/transition';
  import * as Page from '@cio/ui/base/page';
  import { t } from '$lib/utils/functions/translations';
  import { AnalyticsPanelCard } from '$features/analytics';
  import { ExportMenu, RefreshPageData, EmptyState } from '$features/ui';
  import {
    AnalyticsSkeleton,
    CourseFunnel,
    LearnerProgressTable,
    PathAnalyticsKpis,
    StuckItemsList
  } from '$features/learning-path';
  import { learningPathApi, pathAnalyticsApi } from '$features/learning-path/api';
  import { buildPathAnalyticsExportDocument } from '$features/learning-path/utils/path-analytics-export-utils';

  const activePath = $derived(learningPathApi.currentPath);
  const pathId = $derived(activePath?.id);
  const analytics = $derived(pathAnalyticsApi.analytics);

  const exportDocument = $derived(
    analytics
      ? buildPathAnalyticsExportDocument(analytics, activePath?.name || 'Learning path', {
          name: $t('audience.name'),
          email: $t('audience.email'),
          progress: $t('analytics.progress'),
          currentCourse: $t('learningPath.people.table.current_course'),
          enrolled: $t('learningPath.people.table.enrolled'),
          status: $t('learningPath.analytics.export.status')
        })
      : null
  );

  async function handleRefresh() {
    if (!pathId) return;

    await learningPathApi.refreshPath(page.params.publicId);
    void pathAnalyticsApi.getAnalytics(pathId);
  }

  $effect(() => {
    const activePathId = pathId;

    if (!activePathId) return;

    untrack(() => {
      void pathAnalyticsApi.getAnalytics(activePathId);
    });
  });
</script>

<Page.Root class="mx-auto w-[90%] px-4">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>{$t('learningPath.analytics.title')}</Page.Title>
      <Page.Subtitle>{$t('learningPath.analytics.subtitle')}</Page.Subtitle>
    </Page.HeaderContent>
    <Page.Action>
      <div class="flex items-center gap-2">
        {#if exportDocument}
          <ExportMenu
            document={exportDocument}
            estimatedRowCount={exportDocument.rows.length}
            disabled={exportDocument.rows.length === 0}
            testId="path-analytics-export"
          />
        {/if}
        <RefreshPageData onRefresh={handleRefresh} />
      </div>
    </Page.Action>
  </Page.Header>

  <Page.Body>
    {#snippet child()}
      {#if pathAnalyticsApi.isLoadingAnalytics && !analytics}
        <AnalyticsSkeleton />
      {:else if analytics}
        <div class="space-y-6" in:fade>
          <PathAnalyticsKpis summary={analytics.summary} />

          <AnalyticsPanelCard
            title={$t('learningPath.analytics.funnel.title')}
            description={$t('learningPath.analytics.funnel.subtitle')}
          >
            {#snippet children()}
              <CourseFunnel funnel={analytics.funnel} enrolled={analytics.summary.enrolled} />
            {/snippet}
          </AnalyticsPanelCard>

          <AnalyticsPanelCard
            title={$t('learningPath.analytics.stuck.title')}
            description={$t('learningPath.analytics.stuck.subtitle')}
          >
            {#snippet children()}
              <StuckItemsList items={analytics.stuckItems} />
            {/snippet}
          </AnalyticsPanelCard>

          <AnalyticsPanelCard
            title={$t('learningPath.analytics.students.title')}
            description={$t('learningPath.analytics.students.subtitle')}
          >
            {#snippet children()}
              <LearnerProgressTable
                students={analytics.students}
                totalCourses={analytics.funnel.length}
                detailBasePath={page.url.pathname.replace(/\/analytics$/, '/people')}
                backPath={page.url.pathname}
              />
            {/snippet}
          </AnalyticsPanelCard>
        </div>
      {:else}
        <EmptyState title={$t('learningPath.analytics.empty')} description={$t('learningPath.analytics.empty_desc')} />
      {/if}
    {/snippet}
  </Page.Body>
</Page.Root>
