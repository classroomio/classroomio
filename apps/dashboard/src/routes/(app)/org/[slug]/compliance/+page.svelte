<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg } from '$lib/utils/store/org';
  import * as Page from '@cio/ui/base/page';
  import * as Tabs from '@cio/ui/custom/underline-tabs';
  import { Button } from '@cio/ui/base/button';
  import { Spinner } from '@cio/ui/base/spinner';
  import RefreshIcon from '@lucide/svelte/icons/refresh-cw';
  import { StatusTiles, CourseBreakdown, LearnersTable, complianceApi } from '$features/compliance';
  import type { ComplianceLearnerRow } from '$features/compliance/utils/types';

  onMount(() => {
    const orgId = $currentOrg.id;
    if (orgId) complianceApi.ensureFetched(orgId);
  });

  function handleRefresh() {
    const orgId = $currentOrg.id;
    if (!orgId) return;

    complianceApi.fetchOverview(orgId);
  }

  type LearnerStatus = ComplianceLearnerRow['status'];

  const statusFilters: Array<LearnerStatus | 'all'> = [
    'all',
    'compliant',
    'expiring_soon',
    'in_grace_period',
    'non_compliant',
    'in_progress',
    'not_started',
    'waived',
    'no_record'
  ];

  let activeFilter = $state<LearnerStatus | 'all'>('all');
</script>

<svelte:head>
  <title>{$t('compliance.title')} - ClassroomIO</title>
</svelte:head>

<Page.Root class="w-full">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>{$t('compliance.title')}</Page.Title>
      <p class="ui:text-muted-foreground text-sm">{$t('compliance.subtitle')}</p>
    </Page.HeaderContent>
    <Page.Action>
      <Button variant="outline" size="sm" disabled={complianceApi.loading} onclick={handleRefresh}>
        <RefreshIcon class={complianceApi.loading ? 'animate-spin' : ''} />
        {$t('analytics.refresh')}
      </Button>
    </Page.Action>
  </Page.Header>

  <Page.Body>
    {#snippet child()}
      <div class="space-y-6">
        {#if complianceApi.loading && !complianceApi.overview}
          <div class="flex h-32 items-center justify-center">
            <Spinner class="ui:text-muted-foreground size-6" />
          </div>
        {:else}
          <StatusTiles data={complianceApi.overview} />

          <Tabs.Root value="courses">
            <Tabs.List class="mb-6">
              <Tabs.Trigger value="courses">{$t('compliance.tabs.courses')}</Tabs.Trigger>
              <Tabs.Trigger value="learners">{$t('compliance.tabs.learners')}</Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="courses" class="space-y-4">
              <CourseBreakdown rows={complianceApi.overview?.courses ?? []} />
            </Tabs.Content>

            <Tabs.Content value="learners" class="space-y-4">
              <div class="flex flex-wrap gap-2">
                {#each statusFilters as filter (filter)}
                  <Button
                    variant={activeFilter === filter ? 'default' : 'outline'}
                    size="sm"
                    onclick={() => (activeFilter = filter)}
                  >
                    {$t(`compliance.filter.${filter}`)}
                  </Button>
                {/each}
              </div>
              <LearnersTable rows={complianceApi.overview?.learners ?? []} statusFilter={activeFilter} />
            </Tabs.Content>
          </Tabs.Root>
        {/if}
      </div>
    {/snippet}
  </Page.Body>
</Page.Root>
