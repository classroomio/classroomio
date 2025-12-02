<script lang="ts">
  import * as Select from '@cio/ui/base/select';
  import { Spinner } from '@cio/ui/base/spinner';

  import { profile } from '$lib/utils/store/user';
  import { isFreePlan, currentOrg } from '$lib/utils/store/org';
  import { orgApi } from '$lib/features/org/api/org.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$lib/components/Snackbar/store';
  import type { OrgTeamMember } from '$lib/utils/types/org';
  import { ROLE } from '@cio/utils/constants';
  import { ROLE_LABEL } from '$lib/utils/constants/roles';
  import { validateEmailInString } from '$lib/utils/functions/validator';

  import { Badge } from '@cio/ui/base/badge';
  import { Input } from '@cio/ui/base/input';
  import { Button } from '@cio/ui/base/button';
  import { ComingSoon, UpgradeBanner } from '$lib/features/ui';
  import * as Field from '@cio/ui/base/field';

  let emailsStr = $state('');
  let errorMessage = $state('');
  let role = $state(ROLE.TUTOR.toString());
  let isRemoving: number | null = $state(null);

  async function onSendInvite() {
    const { hasError, error: _error, emails } = validateEmailInString(emailsStr);

    if (hasError) {
      errorMessage = _error;
      return;
    }

    errorMessage = '';
    await orgApi.inviteTeamMembers($currentOrg.id, emails, parseInt(role));

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
    isRemoving = id;
    await orgApi.removeTeamMember($currentOrg.id, id);

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
    orgApi.getOrgTeam($currentOrg.id);
  });
</script>

<UpgradeBanner>{$t('upgrade.team')}</UpgradeBanner>

<Field.Group class="max-w-md! w-full px-2">
  <Field.Set>
    <Field.Legend>{$t('course.navItem.people.teams.add')}</Field.Legend>
    <Field.Description class="mb-5">{$t('course.navItem.people.teams.add_team')}</Field.Description>

    <Field.Group>
      <Field.Field>
        <Field.Label>{$t('course.navItem.people.teams.invite')}</Field.Label>
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

      <Field.Field>
        <Field.Label>{$t('course.navItem.people.teams.role')}</Field.Label>
        <Select.Root type="single" bind:value={role} disabled={$isFreePlan}>
          <Select.Trigger id="invite-role" class="w-40">
            <p>{role ? $t(ROLE_LABEL[role]) : $t('course.navItem.people.teams.select_role')}</p>
          </Select.Trigger>
          <Select.Content>
            <Select.Item value={ROLE.ADMIN.toString()}>{$t(ROLE_LABEL[ROLE.ADMIN])}</Select.Item>
            <Select.Item value={ROLE.TUTOR.toString()}>{$t(ROLE_LABEL[ROLE.TUTOR])}</Select.Item>
          </Select.Content>
        </Select.Root>
      </Field.Field>

      <Button
        variant="default"
        onclick={onSendInvite}
        loading={orgApi.isLoading}
        disabled={orgApi.isLoading || $isFreePlan}
      >
        {$t('course.navItem.people.teams.send_invite')}
      </Button>
    </Field.Group>
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
                  <Badge variant="outline" class="bg-yellow-200 text-xs text-yellow-700">
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
