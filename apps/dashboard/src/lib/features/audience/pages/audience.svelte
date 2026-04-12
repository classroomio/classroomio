<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import UsersIcon from '@lucide/svelte/icons/users';
  import { orgApi } from '$features/org/api/org.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { Empty } from '@cio/ui/custom/empty';
  import { UpgradeBanner } from '$features/ui';
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
  import AudiencePagination from '$features/audience/components/audience-pagination.svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import { DEFAULT_ORG_AUDIENCE_QUERY, getAudienceSearchParams } from '$features/org/utils/audience-query-utils';

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
    selectedIds.clear();
  });

  const headers = $derived([
    { key: 'name', value: t.get('audience.name') },
    { key: 'email', value: t.get('audience.email') },
    { key: 'status', value: t.get('audience.status') },
    { key: 'date_joined', value: t.get('audience.date_joined') }
  ]);

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
  const hasSelection = $derived(selectedIds.size > 0);

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
  bind:searchValue
  sortBy={query.sortBy}
  sortOrder={query.sortOrder}
  onSortChange={handleSortChange}
  onOpenAssign={() => (assignModalOpen = true)}
/>

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

    <AudiencePagination count={totalCount} perPage={pageSize} page={currentPage} onPageChange={handlePageChange} />
  </div>
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
