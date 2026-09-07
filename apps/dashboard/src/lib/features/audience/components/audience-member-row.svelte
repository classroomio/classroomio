<script lang="ts">
  import * as Table from '@cio/ui/base/table';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import { Checkbox } from '@cio/ui/base/checkbox';
  import { Badge } from '@cio/ui/base/badge';
  import { UserAvatar } from '@cio/ui/custom/user-avatar';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import type { OrganizationAudienceMember } from '$features/org/utils/types';
  import { t } from '$lib/utils/functions/translations';
  import { PercentRingProgress } from '@cio/ui/custom/percent-ring-progress';
  import {
    canResendAudienceInvite,
    canRevokeAudienceInvite,
    formatActivityAge,
    formatActivityExact,
    memberStatusBadgeVariant,
    memberStatusLabelKey,
    statusBadgeVariant,
    statusLabelKey
  } from '$features/audience/utils/audience-utils';

  interface Props {
    row: OrganizationAudienceMember;
    memberDetailHref: string | null;
    selected: boolean;
    onToggleSelect: () => void;
    inviteActionEmail: string | null;
    deletingMemberId: string | null;
    canDeleteMembers: boolean;
    onResendInvite: (email: string) => void;
    onRevokeInvite: (email: string) => void;
    onDelete: () => void;
  }

  let {
    row,
    memberDetailHref,
    selected,
    onToggleSelect,
    inviteActionEmail,
    deletingMemberId,
    canDeleteMembers,
    onResendInvite,
    onRevokeInvite,
    onDelete
  }: Props = $props();

  const showInviteActions = $derived(
    !row.profileId && (canResendAudienceInvite(row.status) || canRevokeAudienceInvite(row.status))
  );
  const isActionDisabled = $derived(inviteActionEmail === row.email || deletingMemberId === String(row.id));
  const showRowActions = $derived(showInviteActions || canDeleteMembers);

  const lastLoginAge = $derived(formatActivityAge(row.lastLoginAt));
  const lastActiveAge = $derived(formatActivityAge(row.lastActiveAt));
  // Suspended learners read as muted so a filtered list makes their state
  // obvious without needing the status column.
  const isSuspended = $derived(row.memberStatus !== 'ACTIVE');
</script>

<Table.Row class={isSuspended ? 'ui:text-muted-foreground' : undefined}>
  <Table.Cell class="w-10">
    <Checkbox disabled={!row.profileId} checked={selected} onCheckedChange={onToggleSelect} />
  </Table.Cell>
  <Table.Cell>
    {#if memberDetailHref}
      <a href={memberDetailHref} class="ui:text-primary flex items-center gap-2 hover:underline">
        <UserAvatar src={row.avatarUrl} alt={row.name ?? 'User'} class="h-5 w-5" />
        {row.name}
      </a>
    {:else}
      <span class="flex items-center gap-2">
        <UserAvatar src={row.avatarUrl} alt={row.name ?? 'User'} class="h-5 w-5" />
        {row.name}
      </span>
    {/if}
  </Table.Cell>
  <Table.Cell>{row.email}</Table.Cell>
  <Table.Cell>
    {#if isSuspended}
      <Badge variant={memberStatusBadgeVariant(row.memberStatus)}>
        {$t(memberStatusLabelKey(row.memberStatus))}
      </Badge>
    {:else}
      <Badge variant={statusBadgeVariant(row.status)}>{$t(statusLabelKey(row.status))}</Badge>
    {/if}
  </Table.Cell>
  <Table.Cell class="whitespace-nowrap" title={formatActivityExact(row.lastLoginAt)}>
    {lastLoginAge ?? $t('audience.never')}
  </Table.Cell>
  <Table.Cell class="whitespace-nowrap" title={formatActivityExact(row.lastActiveAt)}>
    {lastActiveAge ?? $t('audience.never')}
  </Table.Cell>
  <Table.Cell class="whitespace-nowrap">
    {$t('audience.enrolled_ratio', { completed: row.completedCount, total: row.enrolledCount })}
  </Table.Cell>
  <Table.Cell>
    <PercentRingProgress value={row.progressPercent} />
  </Table.Cell>
  <Table.Cell class="whitespace-nowrap">{row.createdAt}</Table.Cell>
  <Table.Cell class="text-right">
    {#if showRowActions}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          class="ui:hover:bg-muted inline-flex items-center justify-center rounded-md p-1.5"
          aria-label={$t('audience.invite.row_actions_aria')}
          disabled={isActionDisabled}
          onclick={(e) => e.stopPropagation()}
        >
          <EllipsisVerticalIcon class="ui:text-muted-foreground size-4" />
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end">
          {#if canResendAudienceInvite(row.status)}
            <DropdownMenu.Item disabled={isActionDisabled} onclick={() => onResendInvite(row.email)}>
              {$t('audience.invite.resend')}
            </DropdownMenu.Item>
          {/if}
          {#if canRevokeAudienceInvite(row.status)}
            <DropdownMenu.Item
              class="ui:text-destructive ui:focus:text-destructive"
              disabled={isActionDisabled}
              onclick={() => onRevokeInvite(row.email)}
            >
              {$t('audience.invite.revoke')}
            </DropdownMenu.Item>
          {/if}
          {#if canDeleteMembers}
            <DropdownMenu.Item
              class="ui:text-destructive ui:focus:text-destructive"
              disabled={isActionDisabled}
              onclick={onDelete}
            >
              {$t('audience.delete.action')}
            </DropdownMenu.Item>
          {/if}
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    {/if}
  </Table.Cell>
</Table.Row>
