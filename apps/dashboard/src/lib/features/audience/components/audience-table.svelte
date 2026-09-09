<script lang="ts">
  import * as Table from '@cio/ui/base/table';
  import { Checkbox } from '@cio/ui/base/checkbox';
  import type { OrganizationAudienceMember } from '$features/org/utils/types';
  import { t } from '$lib/utils/functions/translations';
  import AudienceMemberRow from './audience-member-row.svelte';
  import AudienceSkeletonRow from './audience-skeleton-row.svelte';
  import { resolve } from '$app/paths';

  interface Header {
    key: string;
    value: string;
  }

  interface Props {
    headers: Header[];
    rows: OrganizationAudienceMember[];
    /** Replaces the rows with placeholders while a reload is in flight. */
    loading?: boolean;
    allPageSelected: boolean;
    somePageSelected: boolean;
    onToggleSelectAll: () => void;
    isRowSelected: (rowId: string) => boolean;
    onToggleRow: (rowId: string) => void;
    inviteActionEmail: string | null;
    deletingMemberId: string | null;
    canDeleteMembers: boolean;
    onResendInvite: (email: string) => void;
    onRevokeInvite: (email: string) => void;
    onDeleteRow: (row: OrganizationAudienceMember) => void;
  }

  let {
    headers,
    rows,
    loading = false,
    allPageSelected,
    somePageSelected,
    onToggleSelectAll,
    isRowSelected,
    onToggleRow,
    inviteActionEmail,
    deletingMemberId,
    canDeleteMembers,
    onResendInvite,
    onRevokeInvite,
    onDeleteRow
  }: Props = $props();

  function memberHref(row: OrganizationAudienceMember): string | null {
    if (!row.profileId) return null;
    return resolve(`${window.location.pathname}/${row.profileId}`, {});
  }
</script>

<!-- Eight columns overflow narrow viewports. The scroll is confined to this
     wrapper so the page body itself never scrolls horizontally. -->
<div class="overflow-x-auto rounded-md border">
  <Table.Root>
    <Table.Header>
      <Table.Row>
        <Table.Head class="w-10">
          <Checkbox
            checked={allPageSelected}
            indeterminate={somePageSelected}
            onCheckedChange={onToggleSelectAll}
            aria-label={$t('audience.select_all')}
          />
        </Table.Head>
        {#each headers as header (header)}
          <Table.Head>{header.value}</Table.Head>
        {/each}
        <Table.Head class="w-12 text-right">
          <span class="sr-only">{$t('audience.invite.row_actions_aria')}</span>
        </Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {#if loading}
        <!-- As many placeholders as the page currently shows, so the table
             keeps its height and the surrounding layout does not jump. -->
        {#each Array(Math.max(rows.length, 1)) as _, index (index)}
          <AudienceSkeletonRow />
        {/each}
      {:else}
        {#each rows as row (String(row.id))}
          <AudienceMemberRow
            {row}
            memberDetailHref={memberHref(row)}
            selected={isRowSelected(String(row.id))}
            onToggleSelect={() => onToggleRow(String(row.id))}
            {inviteActionEmail}
            {deletingMemberId}
            {canDeleteMembers}
            {onResendInvite}
            {onRevokeInvite}
            onDelete={() => onDeleteRow(row)}
          />
        {/each}
      {/if}
    </Table.Body>
  </Table.Root>
</div>
