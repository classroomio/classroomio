<script lang="ts">
  import * as Select from '@cio/ui/base/select';
  import { Spinner } from '@cio/ui/base/spinner';
  import CopyIcon from '@lucide/svelte/icons/copy';

  import { profile } from '$lib/utils/store/user';
  import { getAppOrigin, isFreePlan, currentOrg } from '$lib/utils/store/org';
  import { orgApi } from '$features/org/api/org.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import type { OrgTeamMember } from '$lib/utils/types/org';
  import { ROLE } from '@cio/utils/constants';
  import { ROLE_LABEL } from '$lib/utils/constants/roles';
  import { validateEmailInString } from '$lib/utils/functions/validator';

  import { Badge } from '@cio/ui/base/badge';
  import { Input } from '@cio/ui/base/input';
  import { Button } from '@cio/ui/base/button';
  import { ComingSoon, UpgradeBanner } from '$features/ui';
  import * as Field from '@cio/ui/base/field';

  let emailsStr = $state('');
  let errorMessage = $state('');
  let role = $state(ROLE.TUTOR.toString());
  let isRemoving: number | null = $state(null);

  function buildLinkInviteUrl(token: string): string {
    return `${getAppOrigin()}/invite/link/${encodeURIComponent(token)}`;
  }

  async function onCopyInviteLink() {
    if ($isFreePlan) {
      snackbar.error('upgrade.required');
      return;
    }

    await orgApi.generateLinkInvite(parseInt(role));
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

    errorMessage = '';
    await orgApi.inviteTeamMembers(emails, parseInt(role));

    if (orgApi.success) {
      snackbar.success('snackbar.team_members.invite_sent');
      emailsStr = '';
    } else {
      // Errors are handled by orgApi, but check for field-specific errors
      if (orgApi.errors.emails) {
        errorMessage = orgApi.errors.emails;
      } else if (orgApi.errors.general) {
        snackbar.error(orgApi.errors.general);
      }
    }
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

  const isTeamMemberAdmin = (members: OrgTeamMember[], profileId: string | undefined) => {
    return members.some((member) => member.profileId === profileId && member.isAdmin);
  };

  $effect(() => {
    if (!$currentOrg) return;

    orgApi.getOrgTeam();
  });
</script>

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
          disabled={$isFreePlan}
        />
        {#if errorMessage}
          <Field.Error>{errorMessage}</Field.Error>
        {/if}
      </Field.Field>

      <div class="w-full lg:w-64">
        <Select.Root type="single" bind:value={role} disabled={$isFreePlan}>
          <Select.Trigger id="invite-role" class="ui:w-full ui:max-w-none">
            <p>{role ? $t(ROLE_LABEL[role]) : $t('course.navItem.people.teams.select_role')}</p>
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
          loading={orgApi.isLoading}
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
        <Spinner class="size-10! text-blue-700!" />
      {:else if orgApi.teamMembers.length > 0}
        {#each orgApi.teamMembers as teamMember}
          <Field.Field>
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <p class="mr-3 text-sm text-gray-500 dark:text-white">
                  {teamMember.email}
                </p>
                <Badge variant="secondary" class="mr-3 text-xs">{$t(teamMember.role)}</Badge>
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
