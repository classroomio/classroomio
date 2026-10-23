<script lang="ts">
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
    TopCourses,
    TrendChart,
    marketingApi
  } from '$features/marketing';

  $effect(() => {
    marketingApi.ensureFetched($currentOrg.id);
  });

  function handleRangeChange(days: 7 | 30 | 90) {
    const orgId = $currentOrg.id;
    if (!orgId) return;

    marketingApi.setRange(days, orgId);
  }

  function handleRefresh() {
    const orgId = $currentOrg.id;
    if (!orgId) return;

    marketingApi.refresh(orgId);
  }
</script>

<svelte:head>
  <title>{$t('marketing.title')} - ClassroomIO</title>
</svelte:head>

<Page.Root class="w-full">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>{$t('marketing.title')}</Page.Title>
      <p class="ui:text-muted-foreground text-sm">{$t('marketing.subtitle')}</p>
    </Page.HeaderContent>
    <Page.Action>
      <RangePicker value={marketingApi.range} onChange={handleRangeChange} />
      <RefreshButton loading={marketingApi.loading} onClick={handleRefresh} />
    </Page.Action>
  </Page.Header>

  <Page.Body>
    {#snippet child()}
      <div class="space-y-6">
        <LandingKpis data={marketingApi.landing} loading={marketingApi.loadingLanding} />

        <Tabs.Root value="overview">
          <Tabs.List class="mb-6">
            <Tabs.Trigger value="overview">{$t('analytics.tabs.overview')}</Tabs.Trigger>
            <Tabs.Trigger value="funnel">{$t('analytics.tabs.funnel')}</Tabs.Trigger>
            <Tabs.Trigger value="geography">{$t('analytics.tabs.geography')}</Tabs.Trigger>
            <Tabs.Trigger value="course_types">{$t('analytics.tabs.course_types')}</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="overview" class="space-y-4">
            <TrendChart data={marketingApi.landing} loading={marketingApi.loadingLanding} range={marketingApi.range} />
            <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Funnel data={marketingApi.funnel} loading={marketingApi.loadingFunnel} />
              <TopCourses data={marketingApi.topCourses} loading={marketingApi.loadingTopCourses} />
              <PopularTypes data={marketingApi.popularTypes} loading={marketingApi.loadingPopularTypes} />
            </div>
            <CountriesTable data={marketingApi.country} loading={marketingApi.loadingCountry} />
          </Tabs.Content>

          <Tabs.Content value="funnel">
            <Funnel data={marketingApi.funnel} loading={marketingApi.loadingFunnel} />
          </Tabs.Content>

          <Tabs.Content value="geography">
            <CountriesTable data={marketingApi.country} loading={marketingApi.loadingCountry} />
          </Tabs.Content>

          <Tabs.Content value="course_types" class="space-y-4">
            <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <TopCourses data={marketingApi.topCourses} loading={marketingApi.loadingTopCourses} />
              <PopularTypes data={marketingApi.popularTypes} loading={marketingApi.loadingPopularTypes} />
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </div>
    {/snippet}
  </Page.Body>
</Page.Root>
