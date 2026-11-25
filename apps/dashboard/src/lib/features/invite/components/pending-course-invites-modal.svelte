<script lang="ts">
  import * as Avatar from '@cio/ui/base/avatar';
  import { Button } from '@cio/ui/base/button';
  import * as Dialog from '@cio/ui/base/dialog';
  import * as ResourceListRow from '@cio/ui/custom/resource-list-row';
  import { t } from '$lib/utils/functions/translations';
  import { shortenName } from '$lib/utils/functions/string';
  import { pendingCourseInvitesApi } from '../api/pending-course-invites.svelte';
  import type { PendingCourseInviteItem } from '../utils/types';

  const invites = $derived(pendingCourseInvitesApi.invites);
  const isBusy = $derived(pendingCourseInvitesApi.acceptingInviteId !== null);

  async function handleAccept(invite: PendingCourseInviteItem) {
    const redirectTo = await pendingCourseInvitesApi.acceptInvite(invite.id);

    if (!redirectTo) return;

    localStorage.setItem('classroomio_org_sitename', invite.organization.siteName);
    window.location.href = redirectTo;
  }

  function handleOpenChange(isOpen: boolean) {
    if (isOpen) return;

    if (!isBusy) {
      pendingCourseInvitesApi.closeModal();
    }
  }
</script>

<Dialog.Root open={pendingCourseInvitesApi.isModalOpen && invites.length > 0} onOpenChange={handleOpenChange}>
  <Dialog.Content class="w-full max-w-lg p-6" data-testid="pending-course-invites-modal">
    <Dialog.Header class="p-2">
      <Dialog.Title>{$t('invite.course.modal.title')}</Dialog.Title>
      <Dialog.Description>{$t('invite.course.modal.description')}</Dialog.Description>
    </Dialog.Header>

    <ResourceListRow.Group class="ui:bg-card max-h-80 overflow-y-auto">
      {#each invites as invite (invite.id)}
        <ResourceListRow.Root variant="default" size="sm" class="px-4! py-3!">
          <ResourceListRow.Lead>
            <Avatar.Root class="size-10 rounded-lg">
              <Avatar.Image src={invite.organization.avatarUrl} alt={invite.organization.name} />
              <Avatar.Fallback class="rounded-lg">{shortenName(invite.organization.name)}</Avatar.Fallback>
            </Avatar.Root>
          </ResourceListRow.Lead>
          <ResourceListRow.Main>
            <span class="truncate text-sm font-medium">{invite.course.title}</span>
            <span class="ui:text-muted-foreground truncate text-xs">{invite.organization.name}</span>
          </ResourceListRow.Main>
          <ResourceListRow.End>
            <Button
              size="sm"
              loading={pendingCourseInvitesApi.acceptingInviteId === invite.id}
              disabled={isBusy}
              testId="course-invite-accept"
              onclick={() => handleAccept(invite)}
            >
              {$t('invite.course.modal.accept')}
            </Button>
          </ResourceListRow.End>
        </ResourceListRow.Root>
      {/each}
    </ResourceListRow.Group>

    <Dialog.Footer>
      <Button size="sm" variant="outline" disabled={isBusy} onclick={() => pendingCourseInvitesApi.closeModal()}>
        {$t('invite.course.modal.later')}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
