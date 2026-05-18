<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg } from '$lib/utils/store/org';
  import * as Page from '@cio/ui/base/page';
  import * as Tabs from '@cio/ui/custom/underline-tabs';
  import {
    CountriesTable,
    Funnel,
    LandingKpis,
    PopularTypes,
    RangePicker,
    RefreshButton,
    TrendChart,
    analyticsApi
  } from '$features/analytics';

  onMount(() => {
    const orgId = $currentOrg.id;
    if (orgId) analyticsApi.ensureFetched(orgId);
  });

  function handleRangeChange(days: 7 | 30 | 90) {
    const orgId = $currentOrg.id;
    if (!orgId) return;

    analyticsApi.setRange(days, orgId);
  }

  function handleRefresh() {
    const orgId = $currentOrg.id;
    if (!orgId) return;

    analyticsApi.refresh(orgId);
  }
</script>

<svelte:head>
  <title>{$t('analytics.title')} - ClassroomIO</title>
</svelte:head>

<Page.Root class="w-full">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>{$t('analytics.title')}</Page.Title>
      <p class="ui:text-muted-foreground text-sm">{$t('analytics.subtitle')}</p>
    </Page.HeaderContent>
    <Page.Action>
      <RangePicker value={analyticsApi.range} onChange={handleRangeChange} />
      <RefreshButton loading={analyticsApi.loading} onClick={handleRefresh} />
    </Page.Action>
  </Page.Header>

  <Page.Body>
    {#snippet child()}
      <div class="space-y-6">
        <LandingKpis data={analyticsApi.landing} loading={analyticsApi.loadingLanding} />

        <Tabs.Root value="overview">
          <Tabs.List class="mb-6">
            <Tabs.Trigger value="overview">{$t('analytics.tabs.overview')}</Tabs.Trigger>
            <Tabs.Trigger value="funnel">{$t('analytics.tabs.funnel')}</Tabs.Trigger>
            <Tabs.Trigger value="geography">{$t('analytics.tabs.geography')}</Tabs.Trigger>
            <Tabs.Trigger value="course_types">{$t('analytics.tabs.course_types')}</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="overview" class="space-y-4">
            <TrendChart data={analyticsApi.landing} loading={analyticsApi.loadingLanding} />
            <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Funnel data={analyticsApi.funnel} loading={analyticsApi.loadingFunnel} />
              <PopularTypes data={analyticsApi.popularTypes} loading={analyticsApi.loadingPopularTypes} />
            </div>
            <CountriesTable data={analyticsApi.country} loading={analyticsApi.loadingCountry} />
          </Tabs.Content>

          <Tabs.Content value="funnel">
            <Funnel data={analyticsApi.funnel} loading={analyticsApi.loadingFunnel} />
          </Tabs.Content>

          <Tabs.Content value="geography">
            <CountriesTable data={analyticsApi.country} loading={analyticsApi.loadingCountry} />
          </Tabs.Content>

          <Tabs.Content value="course_types">
            <PopularTypes data={analyticsApi.popularTypes} loading={analyticsApi.loadingPopularTypes} />
          </Tabs.Content>
        </Tabs.Root>
      </div>
    {/snippet}
  </Page.Body>
</Page.Root>
