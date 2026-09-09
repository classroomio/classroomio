<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import UsersIcon from '@lucide/svelte/icons/users';
  import SearchXIcon from '@lucide/svelte/icons/search-x';
  import { Button } from '@cio/ui/base/button';
  import { orgApi } from '$features/org/api/org.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { Empty } from '@cio/ui/custom/empty';
  import { Spinner } from '@cio/ui/base/spinner';
  import { onDestroy } from 'svelte';
  import { TablePagination, UpgradeBanner } from '$features/ui';
  import { currentOrgMaxAudience, isOrgAdmin } from '$lib/utils/store/org';
  import type {
    OrganizationAudience,
    OrganizationAudienceMember,
    OrganizationAudiencePagination,
    OrganizationAudienceQuery
  } from '$features/org/utils/types';
  import AssignCoursesModal from '$features/audience/components/assign-courses-modal.svelte';
  import AudienceDeleteConfirmation from '$features/audience/components/audience-delete-confirmation.svelte';
  import AudienceTableToolbar from '$features/audience/components/audience-table-toolbar.svelte';
  import AudienceTable from '$features/audience/components/audience-table.svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import {
    DEFAULT_ORG_AUDIENCE_QUERY,
    applyAudienceView,
    clearAudienceFilters,
    countActiveAudienceFilters,
    getAudienceSearchParams,
    matchAudienceView,
    toAudienceBulkFilterQuery
  } from '$features/org/utils/audience-query-utils';
  import AudienceBulkConfirmation from '$features/audience/components/audience-bulk-confirmation.svelte';
  import { snackbar } from '$features/ui/snackbar/store';
  import type {
    AudienceBulkAction,
    BulkAudienceActionOutcome,
    BulkAudiencePreview,
    OrganizationAudienceView
  } from '$features/org/utils/types';

  interface Course {
    id: string;
    title: string;
  }

  interface Props {
    audience?: OrganizationAudience;
    pagination?: OrganizationAudiencePagination | null;
    query: OrganizationAudienceQuery;
    courses?: Course[];
  }

  let { audience, pagination = null, query, courses = [] }: Props = $props();

  $effect(() => {
    orgApi.audience = audience ?? [];
    orgApi.audiencePagination = pagination;
    // Selection is per-result-set: a new page or filter is a different
    // population, and carrying a pending destructive selection across it is how
    // people act on rows they never saw.
    selectedIds.clear();
    allMatchingSelected = false;
  });

  const headers = $derived([
    { key: 'name', value: $t('audience.name') },
    { key: 'email', value: $t('audience.email') },
    { key: 'status', value: $t('audience.status') },
    { key: 'last_login', value: $t('audience.filter.last_login') },
    { key: 'last_activity', value: $t('audience.filter.last_activity') },
    { key: 'enrollment', value: $t('audience.filter.enrollment') },
    { key: 'progress', value: $t('audience.progress') },
    { key: 'date_joined', value: $t('audience.date_joined') }
  ]);

  const activeView = $derived(matchAudienceView(query));
  const activeFilterCount = $derived(countActiveAudienceFilters(query));
  const isFiltered = $derived(activeFilterCount > 0 || Boolean(query.search));

  let inviteActionEmail = $state<string | null>(null);
  let deletingMemberId = $state<string | null>(null);
  let deleteCandidate = $state<OrganizationAudienceMember | null>(null);
  let deleteDialogOpen = $state(false);
  let searchValue = $state(query.search ?? '');

  async function handleResendInvite(email: string) {
    inviteActionEmail = email;
    try {
      const result = await orgApi.resendAudienceInvite({ email });
      if (result) {
        await refreshAudience();
      }
    } finally {
      inviteActionEmail = null;
    }
  }

  async function handleRevokeInvite(email: string) {
    inviteActionEmail = email;
    try {
      const result = await orgApi.revokeAudienceInvite({ email });
      if (result) {
        await refreshAudience();
      }
    } finally {
      inviteActionEmail = null;
    }
  }

  let selectedIds = new SvelteSet<string>();
  let assignModalOpen = $state(false);

  const currentPage = $derived(pagination?.page ?? DEFAULT_ORG_AUDIENCE_QUERY.page);
  const pageSize = $derived(pagination?.limit ?? DEFAULT_ORG_AUDIENCE_QUERY.limit);
  const totalCount = $derived(pagination?.total ?? 0);
  const selectablePageRows = $derived(orgApi.audience.filter((row) => row.profileId));

  const allPageSelected = $derived(
    selectablePageRows.length > 0 && selectablePageRows.every((row) => selectedIds.has(String(row.id)))
  );
  const somePageSelected = $derived(
    selectablePageRows.some((row) => selectedIds.has(String(row.id))) && !allPageSelected
  );
  const hasSelection = $derived(selectedIds.size > 0 || allMatchingSelected);

  function toggleSelectAll() {
    if (allPageSelected) {
      for (const row of selectablePageRows) {
        selectedIds.delete(String(row.id));
      }
    } else {
      for (const row of selectablePageRows) {
        selectedIds.add(String(row.id));
      }
    }
  }

  function toggleRow(id: string) {
    if (selectedIds.has(id)) {
      selectedIds.delete(id);
    } else {
      selectedIds.add(id);
    }
  }

  const selectedProfileIds = $derived(
    orgApi.audience.filter((r) => selectedIds.has(String(r.id)) && r.profileId).map((r) => r.profileId!)
  );

  function handleAssigned() {
    assignModalOpen = false;
    selectedIds.clear();
  }

  $effect(() => {
    searchValue = query.search ?? '';
  });

  $effect(() => {
    const normalizedSearch = searchValue.trim() || undefined;
    const currentSearch = query.search ?? undefined;

    if (normalizedSearch === currentSearch) {
      return;
    }

    const timeoutId = setTimeout(() => {
      void navigateAudience({
        ...query,
        page: 1,
        search: normalizedSearch
      });
    }, 300);

    return () => clearTimeout(timeoutId);
  });

  async function refreshAudience(pageOverride = currentPage) {
    await navigateAudience({
      ...query,
      page: pageOverride
    });
  }

  async function navigateAudience(nextQuery: OrganizationAudienceQuery) {
    const searchParams = getAudienceSearchParams(nextQuery);
    const nextSearch = searchParams.toString();
    const currentSearch = page.url.searchParams.toString();

    await goto(`${page.url.pathname}?${nextSearch}`, {
      replaceState: nextSearch === currentSearch,
      keepFocus: true,
      noScroll: true,
      invalidateAll: true
    });
  }

  function handlePageChange(nextPage: number) {
    if (nextPage === currentPage) {
      return;
    }

    void navigateAudience({
      ...query,
      page: nextPage
    });
  }

  function handleSortChange(
    sortBy: OrganizationAudienceQuery['sortBy'],
    sortOrder: OrganizationAudienceQuery['sortOrder']
  ) {
    void navigateAudience({ ...query, page: 1, sortBy, sortOrder });
  }

  // Every filter change resets to page 1: staying on page 7 of a result set
  // that just shrank to two pages shows an empty table.
  function handleFilterChange(patch: Partial<OrganizationAudienceQuery>) {
    void navigateAudience({ ...query, ...patch, page: 1 });
  }

  function handleSelectView(view: OrganizationAudienceView) {
    void navigateAudience(applyAudienceView(view, query));
  }

  function handleClearFilters() {
    void navigateAudience(clearAudienceFilters(query));
  }

  // "All matching" is a mode, not 12,000 ids in a Set. It resolves server-side
  // from the same filters the list used.
  let allMatchingSelected = $state(false);
  let bulkAction = $state<AudienceBulkAction | null>(null);
  let bulkDialogOpen = $state(false);
  let bulkPreview = $state<BulkAudiencePreview | null>(null);
  let isApplyingBulkAction = $state(false);
  let lastUndoToken = $state<string | null>(null);
  // A run the API handed to the queue. Held so the strip can say so and the
  // poll loop can tell "still mine" from "superseded".
  let queuedRun = $state<{ jobId: string; requested: number } | null>(null);

  const bulkTargetCount = $derived(allMatchingSelected ? totalCount : selectedIds.size);

  function clearSelection() {
    selectedIds.clear();
    allMatchingSelected = false;
  }

  async function handleBulkAction(action: AudienceBulkAction) {
    bulkAction = action;
    bulkPreview = null;

    // Filter mode needs the server's exact count and target hash before the
    // admin can approve anything; ids mode already knows precisely who it hits.
    if (allMatchingSelected) {
      const response = await orgApi.previewBulkAudienceAction(query);
      if (!response) {
        bulkAction = null;
        return;
      }

      bulkPreview = response.data;
    }

    bulkDialogOpen = true;
  }

  const QUEUED_POLL_FALLBACK_MS = 3_000;

  // Clearing this is what ends the poll loop; without it a navigation would
  // leave it running against a destroyed component.
  onDestroy(() => {
    queuedRun = null;
  });

  /**
   * Polls a queued run to its terminal state, then reports the same summary the
   * synchronous path shows. The loop exits as soon as `queuedRun` no longer
   * names this job, so leaving the page or starting another run stops it.
   */
  async function pollQueuedRun(jobId: string) {
    for (let pollCount = 0; queuedRun?.jobId === jobId; pollCount += 1) {
      const response = await orgApi.bulkAudienceActionStatus(jobId, pollCount);

      if (!response) {
        queuedRun = null;
        snackbar.error('audience.bulk.queued_lost');

        return;
      }

      const { job, nextPollMs } = response.data;

      if (job.status === 'completed') {
        const outcome = job.result as BulkAudienceActionOutcome | null;
        queuedRun = null;

        if (outcome && outcome.failed.length > 0) {
          snackbar.success(
            t.get('audience.bulk.partial_success', {
              succeeded: outcome.succeeded,
              failed: outcome.failed.length
            })
          );
        } else {
          snackbar.success('audience.bulk.success');
        }

        await refreshAudience();

        return;
      }

      if (job.status === 'failed' || job.status === 'canceled') {
        queuedRun = null;
        snackbar.error('audience.bulk.queued_failed');
        await refreshAudience();

        return;
      }

      await new Promise((resolve) => setTimeout(resolve, nextPollMs ?? QUEUED_POLL_FALLBACK_MS));
    }
  }

  async function handleBulkConfirm(reason: string | undefined) {
    if (!bulkAction) return;

    const target = allMatchingSelected
      ? bulkPreview
        ? ({
            mode: 'filter' as const,
            filter: toAudienceBulkFilterQuery(query),
            expectedCount: bulkPreview.count,
            expectedTargetHash: bulkPreview.targetHash
          } as never)
        : null
      : ({ mode: 'ids' as const, memberIds: [...selectedIds].map(Number) } as never);

    if (!target) return;

    isApplyingBulkAction = true;

    try {
      const response = await orgApi.bulkAudienceAction({ target, action: bulkAction, reason });
      if (!response) return;

      const result = response.data;
      lastUndoToken = 'undoToken' in result ? (result.undoToken ?? null) : null;

      if (result.mode === 'queued') {
        // Too large to apply in the request. Nothing has changed yet, so the
        // list is not refreshed until the run reports back.
        bulkDialogOpen = false;
        bulkAction = null;
        clearSelection();
        queuedRun = { jobId: result.jobId, requested: result.requested };
        snackbar.success(t.get('audience.bulk.queued', { count: result.requested }));
        void pollQueuedRun(result.jobId);

        return;
      }

      if (result.mode === 'completed' && result.failed.length > 0) {
        snackbar.success(
          t.get('audience.bulk.partial_success', { succeeded: result.succeeded, failed: result.failed.length })
        );
      } else {
        snackbar.success('audience.bulk.success');
      }

      bulkDialogOpen = false;
      bulkAction = null;
      clearSelection();
      await refreshAudience();
    } finally {
      isApplyingBulkAction = false;
    }
  }

  let isUndoing = $state(false);

  async function handleUndo() {
    if (!lastUndoToken || isUndoing) return;

    isUndoing = true;

    try {
      const response = await orgApi.undoBulkAudienceAction(lastUndoToken);
      if (!response) return;

      // Cleared only once the server has actually consumed it. Dropping it up
      // front would remove the retry affordance on a failed request, and the
      // token is single-use anyway so a double-click cannot double-apply.
      lastUndoToken = null;
      await refreshAudience();
    } finally {
      isUndoing = false;
    }
  }

  function openDeleteConfirmation(member: OrganizationAudienceMember) {
    deleteCandidate = member;
    deleteDialogOpen = true;
  }

  async function handleDeleteAudienceMember() {
    if (!deleteCandidate) {
      return;
    }

    deletingMemberId = String(deleteCandidate.id);

    try {
      const result = await orgApi.deleteAudienceMember(Number(deleteCandidate.id));
      if (!result) {
        return;
      }

      selectedIds.delete(String(deleteCandidate.id));

      const nextPage = orgApi.audience.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
      await refreshAudience(nextPage);
      deleteCandidate = null;
      deleteDialogOpen = false;
    } finally {
      deletingMemberId = null;
    }
  }
</script>

{#if totalCount >= $currentOrgMaxAudience}
  <UpgradeBanner>{$t('audience.upgrade')}</UpgradeBanner>
{/if}

<AudienceTableToolbar
  {hasSelection}
  selectedCount={selectedIds.size}
  {allMatchingSelected}
  {isApplyingBulkAction}
  bind:searchValue
  {query}
  {activeView}
  {activeFilterCount}
  {totalCount}
  onSortChange={handleSortChange}
  onFilterChange={handleFilterChange}
  onClearFilters={handleClearFilters}
  onSelectView={handleSelectView}
  onOpenAssign={() => (assignModalOpen = true)}
  onSelectAllMatching={() => (allMatchingSelected = true)}
  onClearSelection={clearSelection}
  onBulkAction={handleBulkAction}
/>

{#if queuedRun}
  <div class="flex items-center gap-2 rounded-md border px-4 py-2">
    <Spinner class="size-4" />
    <span class="ui:text-muted-foreground text-sm">
      {$t('audience.bulk.queued_running', { count: queuedRun.requested })}
    </span>
  </div>
{/if}

{#if lastUndoToken}
  <div class="flex items-center gap-2 rounded-md border px-4 py-2">
    <span class="ui:text-muted-foreground text-sm">{$t('audience.bulk.undo_available')}</span>
    <Button variant="secondary" size="sm" onclick={handleUndo} loading={isUndoing} disabled={isUndoing}>
      {$t('audience.bulk.undo')}
    </Button>
  </div>
{/if}

{#if totalCount > 0}
  <div class="w-full space-y-4">
    <AudienceTable
      {headers}
      rows={orgApi.audience}
      {allPageSelected}
      {somePageSelected}
      onToggleSelectAll={toggleSelectAll}
      isRowSelected={(id) => selectedIds.has(id)}
      onToggleRow={toggleRow}
      {inviteActionEmail}
      {deletingMemberId}
      canDeleteMembers={$isOrgAdmin === true}
      onResendInvite={handleResendInvite}
      onRevokeInvite={handleRevokeInvite}
      onDeleteRow={openDeleteConfirmation}
    />

    <TablePagination count={totalCount} perPage={pageSize} page={currentPage} onPageChange={handlePageChange} />
  </div>
{:else if isFiltered}
  <!-- Distinct from the "no audience at all" state: here the roster has people,
       the filters just exclude them, so the action is to clear the filters. -->
  <Empty
    title={$t('audience.filter.empty_title')}
    description={$t('audience.filter.empty_description')}
    icon={SearchXIcon}
    variant="page"
  >
    <Button variant="secondary" onclick={handleClearFilters}>{$t('audience.filter.clear')}</Button>
  </Empty>
{:else}
  <Empty title={$t('audience.no_audience')} description={$t('audience.manage')} icon={UsersIcon} variant="page" />
{/if}

<AssignCoursesModal
  bind:open={assignModalOpen}
  {selectedProfileIds}
  {courses}
  onclose={() => (assignModalOpen = false)}
  onassigned={handleAssigned}
/>

<AudienceDeleteConfirmation
  bind:open={deleteDialogOpen}
  member={deleteCandidate}
  isDeleting={deletingMemberId !== null}
  onDelete={handleDeleteAudienceMember}
/>

<AudienceBulkConfirmation
  bind:open={bulkDialogOpen}
  action={bulkAction}
  count={bulkTargetCount}
  preview={bulkPreview}
  isApplying={isApplyingBulkAction}
  onConfirm={handleBulkConfirm}
/>
