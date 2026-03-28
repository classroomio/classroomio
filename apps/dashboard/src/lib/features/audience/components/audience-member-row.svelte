<script lang="ts">
  import * as Table from '@cio/ui/base/table';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import { Checkbox } from '@cio/ui/base/checkbox';
  import { Badge } from '@cio/ui/base/badge';
  import { UserAvatar } from '@cio/ui/custom/user-avatar';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import type { OrganizationAudienceMember } from '$features/org/utils/types';
  import { t } from '$lib/utils/functions/translations';
  import {
    canResendAudienceInvite,
    canRevokeAudienceInvite,
    statusBadgeVariant,
    statusLabelKey
  } from '$features/audience/utils/audience-utils';

  interface Props {
    row: OrganizationAudienceMember;
    memberDetailHref: string | null;
    selected: boolean;
    onToggleSelect: () => void;
    inviteActionEmail: string | null;
    onResendInvite: (email: string) => void;
    onRevokeInvite: (email: string) => void;
  }

  let { row, memberDetailHref, selected, onToggleSelect, inviteActionEmail, onResendInvite, onRevokeInvite }: Props =
    $props();

  const showInviteActions = $derived(
    !row.profileId && (canResendAudienceInvite(row.status) || canRevokeAudienceInvite(row.status))
  );
</script>

<Table.Row>
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
    <Badge variant={statusBadgeVariant(row.status)}>{$t(statusLabelKey(row.status))}</Badge>
  </Table.Cell>
  <Table.Cell>{row.createdAt}</Table.Cell>
  <Table.Cell class="text-right">
    {#if showInviteActions}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          class="hover:ui:bg-muted inline-flex items-center justify-center rounded-md p-1.5"
          aria-label={$t('audience.invite.row_actions_aria')}
          disabled={inviteActionEmail !== null}
          onclick={(e) => e.stopPropagation()}
        >
          <EllipsisVerticalIcon class="ui:size-4 ui:text-muted-foreground" />
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end">
          {#if canResendAudienceInvite(row.status)}
            <DropdownMenu.Item disabled={inviteActionEmail === row.email} onclick={() => onResendInvite(row.email)}>
              {$t('audience.invite.resend')}
            </DropdownMenu.Item>
          {/if}
          {#if canRevokeAudienceInvite(row.status)}
            <DropdownMenu.Item
              class="ui:text-destructive focus:ui:text-destructive"
              disabled={inviteActionEmail === row.email}
              onclick={() => onRevokeInvite(row.email)}
            >
              {$t('audience.invite.revoke')}
            </DropdownMenu.Item>
          {/if}
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    {/if}
  </Table.Cell>
</Table.Row>
