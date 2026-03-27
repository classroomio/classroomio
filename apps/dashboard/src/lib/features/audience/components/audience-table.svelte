<script lang="ts">
  import * as Table from '@cio/ui/base/table';
  import { Checkbox } from '@cio/ui/base/checkbox';
  import type { OrganizationAudienceMember } from '$features/org/utils/types';
  import { t } from '$lib/utils/functions/translations';
  import AudienceMemberRow from './audience-member-row.svelte';
  import { resolve } from '$app/paths';

  interface Header {
    key: string;
    value: string;
  }

  interface Props {
    headers: Header[];
    rows: OrganizationAudienceMember[];
    allPageSelected: boolean;
    somePageSelected: boolean;
    onToggleSelectAll: () => void;
    isRowSelected: (rowId: string) => boolean;
    onToggleRow: (rowId: string) => void;
    inviteActionEmail: string | null;
    onResendInvite: (email: string) => void;
    onRevokeInvite: (email: string) => void;
  }

  let {
    headers,
    rows,
    allPageSelected,
    somePageSelected,
    onToggleSelectAll,
    isRowSelected,
    onToggleRow,
    inviteActionEmail,
    onResendInvite,
    onRevokeInvite
  }: Props = $props();

  function memberHref(row: OrganizationAudienceMember): string | null {
    if (!row.profileId) return null;
    return resolve(`${window.location.pathname}/${row.profileId}`, {});
  }
</script>

<div class="rounded-md border">
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
      {#each rows as row (String(row.id))}
        <AudienceMemberRow
          {row}
          memberDetailHref={memberHref(row)}
          selected={isRowSelected(String(row.id))}
          onToggleSelect={() => onToggleRow(String(row.id))}
          {inviteActionEmail}
          {onResendInvite}
          {onRevokeInvite}
        />
      {/each}
    </Table.Body>
  </Table.Root>
</div>
