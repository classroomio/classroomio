<script lang="ts">
  import UsersIcon from '@lucide/svelte/icons/users';
  import { orgApi } from '$features/org/api/org.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { Empty } from '@cio/ui/custom/empty';
  import { UpgradeBanner } from '$features/ui';
  import { currentOrgMaxAudience } from '$lib/utils/store/org';
  import type { OrganizationAudience } from '$features/org/utils/types';
  import AssignCoursesModal from '$features/audience/components/assign-courses-modal.svelte';
  import AudienceTableToolbar from '$features/audience/components/audience-table-toolbar.svelte';
  import AudienceTableSkeleton from '$features/audience/components/audience-table-skeleton.svelte';
  import AudienceTable from '$features/audience/components/audience-table.svelte';
  import AudiencePagination from '$features/audience/components/audience-pagination.svelte';
  import { SvelteSet } from 'svelte/reactivity';

  interface Course {
    id: string;
    title: string;
  }

  interface Props {
    audience?: OrganizationAudience;
    courses?: Course[];
  }

  let { audience, courses = [] }: Props = $props();

  $effect(() => {
    if (audience) {
      orgApi.audience = audience;
    }
  });

  const headers = $derived([
    { key: 'name', value: t.get('audience.name') },
    { key: 'email', value: t.get('audience.email') },
    { key: 'status', value: t.get('audience.status') },
    { key: 'date_joined', value: t.get('audience.date_joined') }
  ]);

  let inviteActionEmail = $state<string | null>(null);

  async function handleResendInvite(email: string) {
    inviteActionEmail = email;
    try {
      await orgApi.resendAudienceInvite({ email });
    } finally {
      inviteActionEmail = null;
    }
  }

  async function handleRevokeInvite(email: string) {
    inviteActionEmail = email;
    try {
      await orgApi.revokeAudienceInvite({ email });
    } finally {
      inviteActionEmail = null;
    }
  }

  let pageSize = $state(20);
  let currentPage = $state(1);
  let searchValue = $state('');
  let selectedIds = new SvelteSet<string>();
  let assignModalOpen = $state(false);

  const filteredRows = $derived(
    searchValue
      ? orgApi.audience.filter((row) =>
          Object.values(row).some((val) => String(val).toLowerCase().includes(searchValue.toLowerCase()))
        )
      : orgApi.audience
  );

  const totalPages = $derived(Math.ceil(filteredRows.length / pageSize));
  const startIndex = $derived((currentPage - 1) * pageSize);
  const endIndex = $derived(startIndex + pageSize);
  const paginatedRows = $derived(filteredRows.slice(startIndex, endIndex));

  const selectablePageRows = $derived(paginatedRows.filter((row) => row.profileId));

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
    if (filteredRows.length > 0 && currentPage > totalPages) {
      currentPage = 1;
    }
  });
</script>

{#if orgApi.audience.length >= $currentOrgMaxAudience}
  <UpgradeBanner>{$t('audience.upgrade')}</UpgradeBanner>
{/if}

<AudienceTableToolbar
  {hasSelection}
  selectedCount={selectedIds.size}
  bind:searchValue
  onOpenAssign={() => (assignModalOpen = true)}
/>

{#if orgApi.audience.length || orgApi.isLoading}
  <div class="w-full space-y-4">
    {#if orgApi.isLoading}
      <AudienceTableSkeleton rowCount={pageSize} />
    {:else}
      <AudienceTable
        {headers}
        rows={paginatedRows}
        {allPageSelected}
        {somePageSelected}
        onToggleSelectAll={toggleSelectAll}
        isRowSelected={(id) => selectedIds.has(id)}
        onToggleRow={toggleRow}
        {inviteActionEmail}
        onResendInvite={handleResendInvite}
        onRevokeInvite={handleRevokeInvite}
      />
    {/if}

    <AudiencePagination
      count={filteredRows.length}
      perPage={pageSize}
      page={currentPage}
      onPageChange={(p) => (currentPage = p)}
    />
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
