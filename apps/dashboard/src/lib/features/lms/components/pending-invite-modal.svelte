<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import * as Dialog from '@cio/ui/base/dialog';
  import { classroomio } from '$lib/utils/services/api';
  import { snackbar } from '$features/ui/snackbar/store';
  import { t } from '$lib/utils/functions/translations';
  import { ROLE } from '@cio/utils/constants';
  import type { PendingOrgInvite } from '../utils/types';

  interface Props {
    open?: boolean;
    invite: PendingOrgInvite;
    onAccepted?: (redirectTo?: string) => void;
  }

  let { open = $bindable(false), invite, onAccepted }: Props = $props();

  let isLoading = $state(false);

  const orgName = $derived(invite.organization.name);

  function getInvitationMessage(): string {
    if (invite.roleId === ROLE.STUDENT) {
      return t.get('invite.organization.invitation_student', { orgName });
    }

    if (invite.roleId === ROLE.TUTOR) {
      return t.get('invite.organization.invitation_teacher', { orgName });
    }

    if (invite.roleId === ROLE.ADMIN) {
      return t.get('invite.organization.invitation_admin', { orgName });
    }

    return t.get('invite.organization.invitation_fallback', { orgName, role: invite.roleLabel });
  }

  async function handleAccept() {
    isLoading = true;

    try {
      const response = await classroomio.invite.organization[':inviteId']['accept-by-id'].$post({
        param: { inviteId: invite.id }
      });
      const result = await response.json();

      if (!result.success) {
        const failed = result as { error?: string; message?: string };
        snackbar.error(failed.error ?? failed.message ?? t.get('invite.organization.messages.join_failed'));
        return;
      }

      snackbar.success('invite.organization.messages.joined');
      open = false;
      onAccepted?.(result.data.redirectTo);
    } catch (error) {
      console.error('Failed to accept organization invite by id', error);
      snackbar.error('invite.organization.messages.join_failed');
    } finally {
      isLoading = false;
    }
  }
</script>

<Dialog.Root
  bind:open
  onOpenChange={(isOpen) => {
    if (!isOpen && !isLoading) open = false;
  }}
>
  <Dialog.Content class="w-96 p-6">
    <Dialog.Header class="p-2">
      <Dialog.Title>{$t('invite.organization.page_title', { orgName })}</Dialog.Title>
    </Dialog.Header>

    <div class="mt-2 space-y-3 px-2 text-center">
      <p class="text-sm font-light dark:text-white">{getInvitationMessage()}</p>
      <p class="text-sm font-light dark:text-white">{$t('invite.organization.email_line', { email: invite.email })}</p>
    </div>

    <div class="mt-6 flex items-center justify-between">
      <Button variant="outline" onclick={() => (open = false)} disabled={isLoading}>
        {$t('delete_modal.no')}
      </Button>
      <Button onclick={handleAccept} loading={isLoading} disabled={isLoading}>
        {$t('invite.organization.accept_button')}
      </Button>
    </div>
  </Dialog.Content>
</Dialog.Root>
