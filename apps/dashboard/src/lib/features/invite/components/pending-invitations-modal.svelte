<script lang="ts">
  import * as Avatar from '@cio/ui/base/avatar';
  import { Button } from '@cio/ui/base/button';
  import * as Dialog from '@cio/ui/base/dialog';
  import * as ResourceListRow from '@cio/ui/custom/resource-list-row';
  import MailOpenIcon from '@lucide/svelte/icons/mail-open';
  import UsersIcon from '@lucide/svelte/icons/users';
  import { t } from '$lib/utils/functions/translations';
  import { shortenName } from '$lib/utils/functions/string';
  import { resolve } from '$app/paths';
  import { courseLessonsHref } from '../utils/invitations-utils';
  import { pendingInvitationsApi } from '../api/pending-invitations.svelte';
  import { page } from '$app/state';
  import { ROLE } from '@cio/utils/constants';
  import { ROLE_LABEL } from '$lib/utils/constants/roles';
  import type { PendingInvitationGroup } from '../utils/types';

  const groups = $derived(pendingInvitationsApi.orderedGroups);
  const isBusy = $derived(pendingInvitationsApi.joiningOrgId !== null);
  const hasContent = $derived(groups.length > 0 || pendingInvitationsApi.unverifiedInvite !== null);

  function isJoined(orgId: string) {
    return pendingInvitationsApi.joinedByOrg.has(orgId);
  }

  function roleLine(group: PendingInvitationGroup): string {
    if (group.orgInvite) {
      return inviteRoleLine(group.orgInvite.roleId, group.organization.name);
    }

    return t.get('invite.invitations.pending_courses', { orgName: group.organization.name });
  }

  function inviteRoleLine(roleId: number, orgName: string): string {
    if (roleId === ROLE.STUDENT) {
      return t.get('invite.organization.invitation_student', { orgName });
    }

    const roleLabelKey = ROLE_LABEL[roleId as keyof typeof ROLE_LABEL] ?? ROLE_LABEL[ROLE.TUTOR];

    return t.get('invite.invitations.invitation_team', { orgName, role: t.get(roleLabelKey) });
  }

  async function sendVerificationEmail() {
    await pendingInvitationsApi.sendVerificationEmail(page.url.href);
  }

  async function handleJoin(group: PendingInvitationGroup) {
    const joined = await pendingInvitationsApi.joinOrg(group);
    if (!joined) return;

    if (onJoinedOrg) {
      try {
        await onJoinedOrg(joined.organizationId);
      } catch (error) {
        console.error('Failed to refresh after joining organization:', error);
      }
    }
  }

  function handleOpenChange(isOpen: boolean) {
    if (isOpen) return;

    if (!isBusy) {
      pendingInvitationsApi.closeModal();
    }
  }

  function joinedCourses(orgId: string) {
    return pendingInvitationsApi.joinedCoursesByOrg[orgId] ?? [];
  }

  let { onJoinedOrg = null }: { onJoinedOrg?: ((orgId: string) => void | Promise<void>) | null } = $props();
</script>

<Dialog.Root open={pendingInvitationsApi.isModalOpen && hasContent} onOpenChange={handleOpenChange}>
  <Dialog.Content class="w-full max-w-lg p-6" data-testid="invitations-modal">
    <Dialog.Header class="p-2">
      <Dialog.Title>{$t('invite.invitations.modal.title')}</Dialog.Title>
      <Dialog.Description>{$t('invite.invitations.modal.description')}</Dialog.Description>
    </Dialog.Header>

    <ResourceListRow.Group class="ui:bg-card max-h-80 overflow-y-auto">
      {#if pendingInvitationsApi.unverifiedInvite}
        {@const invite = pendingInvitationsApi.unverifiedInvite}
        <div class="px-4 py-3" data-testid="invitations-verify-to-accept">
          <div class="flex items-center gap-3">
            <Avatar.Root class="size-10 rounded-lg">
              <Avatar.Fallback class="rounded-lg">{shortenName(invite.organization.name)}</Avatar.Fallback>
            </Avatar.Root>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium">{invite.organization.name}</p>
              <p class="ui:text-muted-foreground text-xs">{inviteRoleLine(invite.roleId, invite.organization.name)}</p>
            </div>
          </div>
          <p class="ui:text-muted-foreground mt-3 text-xs">{$t('invite.invitations.verify_to_accept')}</p>
          <Button
            class="mt-2"
            size="sm"
            loading={pendingInvitationsApi.isSendingVerification}
            disabled={pendingInvitationsApi.verificationSent}
            testId="invitations-send-verification"
            onclick={sendVerificationEmail}
          >
            {pendingInvitationsApi.verificationSent
              ? $t('invite.invitations.verification_sent')
              : $t('invite.invitations.send_verification')}
          </Button>
        </div>
      {/if}
      {#each groups as group (group.organization.id)}
        <div class="ui:border-border border-b px-4 py-3 last:border-b-0">
          <div class="flex items-center gap-3">
            <Avatar.Root class="size-10 rounded-lg">
              <Avatar.Image src={group.organization.avatarUrl} alt={group.organization.name} />
              <Avatar.Fallback class="rounded-lg">{shortenName(group.organization.name)}</Avatar.Fallback>
            </Avatar.Root>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium">{group.organization.name}</p>
              <p class="ui:text-muted-foreground truncate text-xs">
                {roleLine(group)}
                {#if group.courses.length > 0}
                  · {$t('invite.invitations.courses_count', { count: group.courses.length })}
                {/if}
              </p>
            </div>
            <Button
              size="sm"
              loading={pendingInvitationsApi.joiningOrgId === group.organization.id}
              disabled={isBusy || isJoined(group.organization.id)}
              testId="invitations-join-org"
              onclick={() => handleJoin(group)}
            >
              {#if isJoined(group.organization.id)}
                {$t('invite.invitations.joined_button')}
              {:else}
                {$t('invite.invitations.join_org', { orgName: group.organization.name })}
              {/if}
            </Button>
          </div>

          {#if group.courses.length > 0 || group.cohorts.length > 0}
            <ul class="mt-2 space-y-1 pl-[52px]">
              {#each group.courses as course (course.courseId)}
                <li class="ui:text-muted-foreground flex items-center gap-1.5 truncate text-xs">
                  <MailOpenIcon class="size-3 shrink-0" />
                  <span class="truncate">{course.title ?? $t('invite.invitations.untitled_course')}</span>
                </li>
              {/each}
              {#each group.cohorts as cohort (cohort.cohortId)}
                <li class="ui:text-muted-foreground flex items-center gap-1.5 truncate text-xs">
                  <UsersIcon class="size-3 shrink-0" />
                  <span class="truncate">{cohort.name ?? $t('invite.invitations.untitled_cohort')}</span>
                </li>
              {/each}
            </ul>
          {/if}

          {#if joinedCourses(group.organization.id).length > 0}
            <div class="ui:bg-muted mt-2 rounded-lg p-3 pl-[52px]">
              <p class="text-xs font-medium">{$t('invite.invitations.joined_title')}</p>
              <ul class="mt-1 space-y-1">
                {#each joinedCourses(group.organization.id) as course (course.id)}
                  <li class="text-xs">
                    <a
                      class="underline underline-offset-2"
                      href={resolve(courseLessonsHref(course.id), {})}
                      onclick={() => pendingInvitationsApi.closeModal()}
                    >
                      {course.title ?? $t('invite.invitations.untitled_course')}
                    </a>
                  </li>
                {/each}
              </ul>
            </div>
          {/if}
        </div>
      {/each}
    </ResourceListRow.Group>

    <Dialog.Footer>
      <Button size="sm" variant="outline" disabled={isBusy} onclick={() => pendingInvitationsApi.closeModal()}>
        {$t('invite.invitations.later')}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
