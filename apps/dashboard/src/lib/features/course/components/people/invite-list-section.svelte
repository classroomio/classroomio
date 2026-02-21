<script lang="ts">
  import copy from 'copy-to-clipboard';
  import CopyIcon from '@lucide/svelte/icons/copy';
  import TrashIcon from '@lucide/svelte/icons/trash';
  import { Button } from '@cio/ui/base/button';
  import { Spinner } from '@cio/ui/base/spinner';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import { peopleApi } from '$features/course/api';
  import { formatDate, shortId, getStatusClass } from './invite-utils';
  import type { InviteListItem, InviteAuditItem } from './types';

  const INVITE_MODAL = 'course.navItem.people.invite_modal';

  interface Props {
    courseId: string;
    invites: InviteListItem[];
    isLoading: boolean;
    onRefresh: () => void;
  }

  let { courseId, invites, isLoading, onRefresh }: Props = $props();

  let expandedInviteId = $state<string | null>(null);
  let inviteAuditById = $state<Record<string, InviteAuditItem[]>>({});

  async function revokeInvite(inviteId: string) {
    if (!courseId) return;
    const revoked = await peopleApi.revokeStudentInvite(courseId, inviteId);
    if (!revoked) {
      snackbar.error(`${INVITE_MODAL}.snackbar_failed_revoke_invite`);
      return;
    }
    snackbar.success(`${INVITE_MODAL}.snackbar_invite_revoked`);
    onRefresh();
  }

  async function toggleAudit(inviteId: string) {
    if (!courseId) return;
    if (expandedInviteId === inviteId) {
      expandedInviteId = null;
      return;
    }

    if (!inviteAuditById[inviteId]) {
      const audit = await peopleApi.getStudentInviteAudit(courseId, inviteId);
      if (!audit) {
        snackbar.error(`${INVITE_MODAL}.snackbar_failed_load_audit`);
        return;
      }
      inviteAuditById[inviteId] = audit as InviteAuditItem[];
    }

    expandedInviteId = inviteId;
  }

  function copyInviteMetadata(invite: InviteListItem) {
    const metadata = JSON.stringify(
      {
        inviteId: invite.id,
        status: invite.status,
        expiresAt: invite.expiresAt,
        usedCount: invite.usedCount,
        maxUses: invite.maxUses,
        usesRemaining: invite.usesRemaining,
        createdAt: invite.createdAt,
        revokedAt: invite.revokedAt,
        activity: invite.activity
      },
      null,
      2
    );
    copy(metadata);
    snackbar.success(`${INVITE_MODAL}.snackbar_metadata_copied`);
  }
</script>

<div class="rounded-md border p-4">
  <div class="mb-3 flex items-center justify-between">
    <p class="text-base font-semibold">{$t(`${INVITE_MODAL}.existing_invites`)}</p>
    <Button variant="secondary" onclick={onRefresh} loading={isLoading}>
      {$t(`${INVITE_MODAL}.refresh`)}
    </Button>
  </div>

  {#if isLoading}
    <div class="flex items-center gap-2 text-sm">
      <Spinner class="h-4 w-4" />
      {$t(`${INVITE_MODAL}.loading_invites`)}
    </div>
  {:else if invites.length === 0}
    <p class="ui:text-muted-foreground text-sm">{$t(`${INVITE_MODAL}.no_invites_yet`)}</p>
  {:else}
    <div class="space-y-3">
      {#each invites as invite}
        <div class="rounded-md border p-3">
          <div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div class="space-y-1 text-sm">
              <div class="flex items-center gap-2">
                <span class="font-mono text-xs">{shortId(invite.id)}</span>
                <span class={`rounded px-2 py-0.5 text-xs ${getStatusClass(invite.status)}`}>{invite.status}</span>
              </div>
              <div>{$t(`${INVITE_MODAL}.created`)}: {formatDate(invite.createdAt)}</div>
              <div>{$t(`${INVITE_MODAL}.expires`)}: {formatDate(invite.expiresAt)}</div>
              <div>
                {$t(`${INVITE_MODAL}.uses`)}: {invite.usedCount}/{invite.maxUses} ({$t(`${INVITE_MODAL}.remaining`)}: {invite.usesRemaining})
              </div>
              <div>
                {$t(`${INVITE_MODAL}.opened`)}: {invite.activity.previewedCount} | {$t(`${INVITE_MODAL}.joined`)}: {invite
                  .activity.acceptedCount}
              </div>
              <div>
                {$t(`${INVITE_MODAL}.email_sent`)}: {invite.activity.emailSentCount} | {$t(
                  `${INVITE_MODAL}.email_failed`
                )}: {invite.activity.emailFailedCount}
              </div>
            </div>

            <div class="flex flex-wrap gap-2">
              <Button variant="secondary" onclick={() => copyInviteMetadata(invite)}>
                <CopyIcon size={14} class="mr-1" />
                {$t(`${INVITE_MODAL}.copy_metadata`)}
              </Button>
              {#if invite.status === 'ACTIVE'}
                <Button variant="secondary" onclick={() => revokeInvite(invite.id)}>
                  <TrashIcon size={14} class="mr-1" />
                  {$t(`${INVITE_MODAL}.revoke`)}
                </Button>
              {/if}
              <Button variant="secondary" onclick={() => toggleAudit(invite.id)}>
                {expandedInviteId === invite.id ? $t(`${INVITE_MODAL}.hide_audit`) : $t(`${INVITE_MODAL}.view_audit`)}
              </Button>
            </div>
          </div>

          {#if expandedInviteId === invite.id}
            <div class="mt-3 space-y-2 border-t pt-3">
              {#if !inviteAuditById[invite.id]?.length}
                <p class="ui:text-muted-foreground text-sm">{$t(`${INVITE_MODAL}.no_audit_events`)}</p>
              {:else}
                {#each inviteAuditById[invite.id] as event}
                  <div class="rounded border p-2 text-xs">
                    <div class="font-semibold">{event.eventType}</div>
                    <div>{$t(`${INVITE_MODAL}.audit_at`)}: {formatDate(event.createdAt)}</div>
                    {#if event.targetEmail}
                      <div>{$t(`${INVITE_MODAL}.audit_email`)}: {event.targetEmail}</div>
                    {/if}
                    {#if event.actor?.email}
                      <div>{$t(`${INVITE_MODAL}.audit_actor`)}: {event.actor.email}</div>
                    {/if}
                    {#if event.ipAddress}
                      <div>{$t(`${INVITE_MODAL}.audit_ip`)}: {event.ipAddress}</div>
                    {/if}
                  </div>
                {/each}
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>
