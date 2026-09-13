<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { ExportMenu } from '$features/ui';
  import { orgApi } from '$features/org/api/org.svelte';
  import { buildAudienceExportDocument } from '$features/audience/utils/audience-export-utils';
  import { currentOrg } from '$lib/utils/store/org';
  import { AudiencePage } from '$features/audience/pages';
  import AudienceBulkBar from '$features/audience/components/audience-bulk-bar.svelte';
  import type { AudienceSelectionControls } from '$features/audience/utils/types';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrgPlan, currentOrgMaxAudience } from '$lib/utils/store/org';
  import { PLAN } from '@cio/utils/plans';
  import * as Page from '@cio/ui/base/page';
  import { page } from '$app/state';
  import { resolve } from '$app/paths';

  let { data } = $props();

  const audienceLength = $derived(data.pagination?.total || 0);

  // Built on demand from the current filters, so the file matches the list the
  // admin just reviewed rather than the whole roster.
  // Bound from the table below, so the export can follow a tick-box selection.
  let selectedMemberIds = $state<number[]>([]);
  // Bound from the page: the selection bar sits here, as a sibling of
  // Page.Body, so it sticks to the content column rather than the viewport.
  let selectionControls = $state<AudienceSelectionControls | null>(null);
  const exportRowCount = $derived(selectedMemberIds.length || audienceLength);

  async function loadExportDocument() {
    const response = await orgApi.getAudienceExportRows(
      data.query,
      selectedMemberIds.length > 0 ? selectedMemberIds : undefined
    );
    const rows = response?.data ?? [];

    return buildAudienceExportDocument(rows, $currentOrg?.name ?? 'Organization', {
      name: $t('audience.name'),
      email: $t('audience.email'),
      memberStatus: $t('audience.filter.status'),
      inviteStatus: $t('audience.status'),
      joined: $t('audience.date_joined'),
      lastLogin: $t('audience.filter.last_login'),
      lastActivity: $t('audience.filter.last_activity'),
      enrolled: $t('audience.filter.enrollment'),
      completed: $t('audience.filter.completed'),
      progress: $t('audience.progress')
    });
  }
  const atStudentLimit = $derived(audienceLength >= $currentOrgMaxAudience);
</script>

<svelte:head>
  <title>Audience - ClassroomIO</title>
</svelte:head>

<Page.Root class="mx-auto w-full max-w-6xl">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>
        {$t('audience.title')}
        {#if $currentOrgPlan?.planName !== PLAN.ENTERPRISE}
          <span class="ml-2 text-sm">
            ({audienceLength} / {$currentOrgMaxAudience})
          </span>
        {/if}
      </Page.Title>
      <Page.Subtitle>{$t('audience.page_subtitle')}</Page.Subtitle>
    </Page.HeaderContent>
    <Page.Action>
      <ExportMenu
        document={loadExportDocument}
        estimatedRowCount={exportRowCount}
        disabled={audienceLength === 0}
        testId="audience-export"
      />
      <Button
        variant="secondary"
        disabled={atStudentLimit}
        href={atStudentLimit ? '#' : resolve(`${page.url.pathname}/import`, {})}
        title={atStudentLimit ? $t('audience.import_limit_reached') : undefined}
      >
        {$t('audience.import_users')}
      </Button>
    </Page.Action>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      <AudiencePage
        audience={data.audience}
        pagination={data.pagination}
        query={data.query}
        courses={data.courses}
        bind:selectedMemberIds
        bind:selectionControls
      />
    {/snippet}
  </Page.Body>
  {#if selectionControls}
    <AudienceBulkBar
      selectedCount={selectionControls.selectedCount}
      totalMatching={selectionControls.totalMatching}
      allMatchingSelected={selectionControls.allMatchingSelected}
      isApplying={selectionControls.isApplying}
      document={selectionControls.loadDocument}
      onSelectAllMatching={selectionControls.selectAllMatching}
      onClearSelection={selectionControls.clear}
      onOpenAssign={selectionControls.openAssign}
      onAction={selectionControls.act}
    />
  {/if}
</Page.Root>
