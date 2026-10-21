<script lang="ts">
  import * as Select from '@cio/ui/base/select';
  import { CompactLoader } from '@cio/ui/custom/compact-loader';
  import { Empty } from '@cio/ui/custom/empty';
  import LockIcon from '@lucide/svelte/icons/lock';
  import CopyIcon from '@lucide/svelte/icons/copy';

  import { profile } from '$lib/utils/store/user';
  import { getAppOrigin, isFreePlan, currentOrg, isOrgAdmin } from '$lib/utils/store/org';
  import { orgApi } from '$features/org/api/org.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import type { TeamInviteConfirmation } from '$features/org/utils/types';
  import type { OrgTeamMember } from '$lib/utils/types/org';
  import { ROLE } from '@cio/utils/constants';
  import { ROLE_LABEL } from '$lib/utils/constants/roles';
  import { validateEmailInString } from '$lib/utils/functions/validator';

  import { Badge } from '@cio/ui/base/badge';
  import { Input } from '@cio/ui/base/input';
  import { Button } from '@cio/ui/base/button';
  import { ComingSoon, UpgradeBanner } from '$features/ui';
  import * as Dialog from '@cio/ui/base/dialog';
  import * as Field from '@cio/ui/base/field';

  let emailsStr = $state('');
  let errorMessage = $state('');
  let role = $state(ROLE.TUTOR.toString());
  let isRemoving: number | null = $state(null);
  let isSendingInvite = $state(false);
  let pendingInvite = $state<TeamInviteConfirmation | null>(null);
  let isUpdatingRole = $state(false);
  let roleSelectVersion = $state(0);
  let pendingRoleChange = $state<{
    memberId: number;
    email: string;
    currentRoleId: number;
    nextRoleId: number;
  } | null>(null);

  function buildLinkInviteUrl(token: string): string {
    return `${getAppOrigin()}/invite/link/${encodeURIComponent(token)}`;
  }

  async function onCopyInviteLink() {
    if ($isFreePlan) {
      snackbar.error('upgrade.required');
      return;
    }

    const selectedRoleId = parseInt(role);
    await orgApi.generateLinkInvite(selectedRoleId);

    if (!orgApi.success || orgApi.linkInvite?.roleId !== selectedRoleId) return;

    const linkInviteToken = orgApi.linkInvite?.token;

    if (!linkInviteToken) return;

    await navigator.clipboard.writeText(buildLinkInviteUrl(linkInviteToken));
  }

  async function onSendInvite() {
    // Prevent free plan users from bypassing UI restrictions
    if ($isFreePlan) {
      snackbar.error('upgrade.required');
      return;
    }

    const { hasError, error: _error, emails } = validateEmailInString(emailsStr);

    if (hasError) {
      errorMessage = _error;
      return;
    }

    await sendTeamInvites(emails, parseInt(role));
  }

  async function sendTeamInvites(emails: string[], selectedRoleId: number, confirmedStudentEmails: string[] = []) {
    if (isSendingInvite || !$isOrgAdmin) return;

    if ($isFreePlan) {
      snackbar.error('upgrade.required');
      return;
    }

    const organizationId = $currentOrg.id;
    errorMessage = '';
    isSendingInvite = true;
    const response = await orgApi.inviteTeamMembers(emails, selectedRoleId, confirmedStudentEmails);
    isSendingInvite = false;

    if (organizationId !== $currentOrg.id) return;

    if (!response) {
      pendingInvite = null;
      errorMessage = orgApi.errors.emails || orgApi.errors.general || t.get('snackbar.team_members.invite_fail');
      return;
    }

    const result = response.data;
    if (result.existingTeamMembers.length > 0) {
      const members = result.existingTeamMembers
        .map((member) => `${member.email} (${t.get(roleLabel(member.roleId))})`)
        .join(', ');
      errorMessage = t.get('settings.teams.invite.existing', { members });
      pendingInvite = null;
      return;
    }

    if (result.requiresConfirmation) {
      pendingInvite = { organizationId, emails, roleId: selectedRoleId, studentEmails: result.studentEmails };
      return;
    }

    pendingInvite = null;
    emailsStr = result.failedEmails.join(', ');

    if (result.queuedCount > 0) {
      snackbar.success('snackbar.team_members.invite_sent');
    }

    if (result.failedEmails.length > 0) {
      errorMessage = `${t.get('snackbar.team_members.invite_fail')}: ${emailsStr}`;
    }
  }

  function handleInviteDialogOpenChange(isOpen: boolean) {
    if (isOpen || isSendingInvite) return;

    pendingInvite = null;
  }

  async function confirmStudentInvites() {
    const invite = pendingInvite;
    if (!invite || invite.organizationId !== $currentOrg.id) return;

    await sendTeamInvites(invite.emails, invite.roleId, invite.studentEmails);
  }

  async function onRemove(id: number) {
    // Prevent free plan users from bypassing UI restrictions
    if ($isFreePlan) {
      snackbar.error('upgrade.required');
      return;
    }

    isRemoving = id;
    await orgApi.removeTeamMember(id);

    if (orgApi.success) {
      snackbar.success('snackbar.team_members.remove_success');
    } else {
      snackbar.error('snackbar.team_members.remove_fail');
    }

    isRemoving = null;
  }

  function roleLabel(roleId: number) {
    if (roleId === ROLE.ADMIN || roleId === ROLE.TUTOR || roleId === ROLE.STUDENT) {
      return ROLE_LABEL[roleId];
    }

    return ROLE_LABEL[ROLE.TUTOR];
  }

  function requestRoleChange(member: { id: number; email: string; roleId: number }, nextRole: string) {
    if ($isFreePlan) {
      snackbar.error('upgrade.required');
      return;
    }

    const nextRoleId = Number(nextRole);
    if (!Number.isInteger(nextRoleId) || nextRoleId === member.roleId) return;

    pendingRoleChange = {
      memberId: member.id,
      email: member.email,
      currentRoleId: member.roleId,
      nextRoleId
    };
  }

  function cancelRoleChange() {
    if (isUpdatingRole) return;

    pendingRoleChange = null;
    roleSelectVersion += 1;
  }

  async function approveRoleChange() {
    if (!pendingRoleChange || isUpdatingRole) return;

    if ($isFreePlan) {
      snackbar.error('upgrade.required');
      pendingRoleChange = null;
      roleSelectVersion += 1;
      return;
    }

    const memberId = pendingRoleChange.memberId;
    const roleId = pendingRoleChange.nextRoleId;
    if (roleId !== ROLE.ADMIN && roleId !== ROLE.TUTOR) return;

    isUpdatingRole = true;
    await orgApi.updateTeamMemberRole(memberId, roleId);
    isUpdatingRole = false;

    if (orgApi.success) {
      pendingRoleChange = null;
    }
  }

  function handleRoleDialogOpenChange(isOpen: boolean) {
    if (isOpen) return;

    cancelRoleChange();
  }

  const isTeamMemberAdmin = (members: OrgTeamMember[], profileId: string | undefined) => {
    return members.some((member) => member.profileId === profileId && member.isAdmin);
  };

  const pendingInviteEmails = $derived(pendingInvite?.studentEmails.join(', ') ?? '');
  const pendingInviteCount = $derived(pendingInvite?.studentEmails.length ?? 0);
  const pendingInviteRoleLabel = $derived($t(roleLabel(pendingInvite?.roleId ?? ROLE.TUTOR)));

  let listedOrgId = '';

  $effect(() => {
    const organizationId = $currentOrg.id;
    if (!$isOrgAdmin) {
      listedOrgId = '';
      return;
    }

    if (!organizationId || organizationId === listedOrgId) return;

    listedOrgId = organizationId;
    void orgApi.getOrgTeam();
  });
</script>

{#if $isOrgAdmin === false}
  <Empty
    title={$t('settings.teams.permission.title')}
    description={$t('settings.teams.permission.description')}
    icon={LockIcon}
    variant="page"
  />
{:else if $isOrgAdmin}
  <UpgradeBanner>{$t('upgrade.team')}</UpgradeBanner>

  <Field.Group class="w-full max-w-3xl! px-2">
    <Field.Set>
      <Field.Legend>{$t('course.navItem.people.teams.add')}</Field.Legend>
      <Field.Description class="mb-5">{$t('course.navItem.people.teams.add_team')}</Field.Description>

      <div class="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_16rem_auto] lg:items-start">
        <Field.Field class="min-w-0">
          <Input
            placeholder={$t('course.navItem.people.teams.placeholder')}
            bind:value={emailsStr}
            class="w-full"
            disabled={$isFreePlan || isSendingInvite}
            oninput={() => {
              errorMessage = '';
              orgApi.clearError('emails');
            }}
          />
          {#if errorMessage}
            <Field.Error>{errorMessage}</Field.Error>
          {/if}
        </Field.Field>

        <div class="w-full lg:w-64">
          <Select.Root type="single" bind:value={role} disabled={$isFreePlan || isSendingInvite}>
            <Select.Trigger id="invite-role" class="w-full max-w-none">
              <p>{role ? $t(ROLE_LABEL[role]) : $t('course.navItem.people.teams.link_invite.select_role')}</p>
            </Select.Trigger>
            <Select.Content>
              <Select.Item value={ROLE.ADMIN.toString()}>{$t(ROLE_LABEL[ROLE.ADMIN])}</Select.Item>
              <Select.Item value={ROLE.TUTOR.toString()}>{$t(ROLE_LABEL[ROLE.TUTOR])}</Select.Item>
            </Select.Content>
          </Select.Root>

          <Button
            variant="link"
            size="sm"
            class="h-auto justify-start"
            onclick={onCopyInviteLink}
            loading={orgApi.isLoading}
            disabled={orgApi.isLoading || $isFreePlan}
          >
            <CopyIcon size={14} />
            {$t('course.navItem.people.teams.link_invite.copy_invite_link')}
          </Button>
        </div>

        <div class="lg:self-start">
          <Button
            variant="default"
            onclick={onSendInvite}
            loading={isSendingInvite}
            disabled={orgApi.isLoading || $isFreePlan}
          >
            {$t('course.navItem.people.teams.send_invite')}
          </Button>
        </div>
      </div>
    </Field.Set>

    <Field.Separator />

    <Field.Set>
      <Field.Legend>{$t('course.navItem.people.teams.members')}</Field.Legend>
      <Field.Group>
        {#if orgApi.isLoading && orgApi.teamMembers.length === 0}
          <CompactLoader label={$t('common.loading')} />
        {:else if orgApi.teamMembers.length > 0}
          {#each orgApi.teamMembers as teamMember}
            <Field.Field>
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <p class="mr-3 text-sm text-gray-500 dark:text-white">
                    {teamMember.email}
                  </p>
                  {#if teamMember.profileId !== $profile.id && isTeamMemberAdmin(orgApi.teamMembers, $profile.id)}
                    {#key `${teamMember.id}-${teamMember.roleId}-${roleSelectVersion}`}
                      <Select.Root
                        type="single"
                        value={teamMember.roleId.toString()}
                        disabled={$isFreePlan || isUpdatingRole || pendingRoleChange !== null}
                        onValueChange={(nextRole) => {
                          if (!nextRole) return;

                          requestRoleChange(teamMember, nextRole);
                        }}
                      >
                        <Select.Trigger
                          size="sm"
                          class="mr-3"
                          data-testid={`team-member-role-${teamMember.id}`}
                          aria-label={$t('course.navItem.people.teams.change_role.label', {
                            email: teamMember.email
                          })}
                        >
                          {$t(roleLabel(teamMember.roleId))}
                        </Select.Trigger>
                        <Select.Content>
                          <Select.Item value={ROLE.ADMIN.toString()}>{$t(ROLE_LABEL[ROLE.ADMIN])}</Select.Item>
                          <Select.Item value={ROLE.TUTOR.toString()}>{$t(ROLE_LABEL[ROLE.TUTOR])}</Select.Item>
                        </Select.Content>
                      </Select.Root>
                    {/key}
                  {:else}
                    <Badge variant="secondary" class="mr-3 text-xs">{$t(teamMember.role)}</Badge>
                  {/if}
                  {#if !teamMember.verified}
                    <Badge variant="outline" class="bg-yellow-200 text-xs text-yellow-700 dark:bg-yellow-700">
                      {$t('course.navItem.people.teams.invite_sent')}
                    </Badge>
                  {:else if teamMember.profileId === $profile.id}
                    <ComingSoon label={$t('course.navItem.people.teams.you')} />
                  {/if}
                </div>
                {#if teamMember.profileId !== $profile.id && isTeamMemberAdmin(orgApi.teamMembers, $profile.id)}
                  <Button
                    variant="ghost"
                    onclick={() => onRemove(teamMember.id)}
                    loading={isRemoving === teamMember.id}
                    disabled={isRemoving === teamMember.id}
                    class="text-red-500 hover:text-red-700"
                  >
                    {$t('course.navItem.people.teams.remove')}
                  </Button>
                {/if}
              </div>
            </Field.Field>
          {/each}
        {/if}
      </Field.Group>
    </Field.Set>
  </Field.Group>

  <Dialog.Root open={pendingInvite !== null} onOpenChange={handleInviteDialogOpenChange}>
    <Dialog.Content class="w-full max-w-md">
      <Dialog.Header>
        <Dialog.Title>
          {$t('settings.teams.invite.confirm_title', { count: pendingInviteCount })}
        </Dialog.Title>
        <Dialog.Description class="max-h-[55vh] overflow-y-auto break-words">
          {#if pendingInvite}
            {$t('settings.teams.invite.confirm_description', {
              count: pendingInviteCount,
              emails: pendingInviteEmails,
              role: pendingInviteRoleLabel
            })}
          {/if}
        </Dialog.Description>
      </Dialog.Header>
      <Dialog.Footer>
        <Button
          variant="outline"
          size="sm"
          onclick={() => handleInviteDialogOpenChange(false)}
          disabled={isSendingInvite}
        >
          {$t('common.cancel')}
        </Button>
        <Button
          size="sm"
          testId="confirm-student-team-invite"
          onclick={confirmStudentInvites}
          loading={isSendingInvite}
          disabled={isSendingInvite}
        >
          {$t('course.navItem.people.teams.send_invite')}
        </Button>
      </Dialog.Footer>
    </Dialog.Content>
  </Dialog.Root>

  <Dialog.Root open={pendingRoleChange !== null} onOpenChange={handleRoleDialogOpenChange}>
    <Dialog.Content class="w-full max-w-md">
      <Dialog.Header>
        <Dialog.Title>{$t('course.navItem.people.teams.change_role.title')}</Dialog.Title>
        <Dialog.Description>
          {#if pendingRoleChange}
            {$t('course.navItem.people.teams.change_role.description', {
              email: pendingRoleChange.email,
              currentRole: $t(roleLabel(pendingRoleChange.currentRoleId)),
              nextRole: $t(roleLabel(pendingRoleChange.nextRoleId))
            })}
          {/if}
        </Dialog.Description>
      </Dialog.Header>
      <Dialog.Footer>
        <Button
          variant="outline"
          size="sm"
          testId="team-member-role-cancel"
          onclick={cancelRoleChange}
          disabled={isUpdatingRole}
        >
          {$t('course.navItem.people.teams.change_role.cancel')}
        </Button>
        <Button
          size="sm"
          testId="team-member-role-approve"
          onclick={approveRoleChange}
          loading={isUpdatingRole}
          disabled={isUpdatingRole || !pendingRoleChange}
        >
          {$t('course.navItem.people.teams.change_role.approve')}
        </Button>
      </Dialog.Footer>
    </Dialog.Content>
  </Dialog.Root>
{/if}
