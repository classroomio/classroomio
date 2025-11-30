<script lang="ts">
  import { untrack } from 'svelte';
  import * as Select from '@cio/ui/base/select';
  import { Spinner } from '@cio/ui/base/spinner';

  import { profile } from '$lib/utils/store/user';
  import { isFreePlan, currentOrg, orgTeam } from '$lib/utils/store/org';
  import { getOrgTeam } from '$lib/utils/services/org';
  import { t } from '$lib/utils/functions/translations';
  import { supabase } from '$lib/utils/functions/supabase';
  import { snackbar } from '$lib/components/Snackbar/store';
  import type { OrgTeamMember } from '$lib/utils/types/org';
  import { ROLE_LABEL } from '$lib/utils/constants/roles';
  import { ROLE } from '@cio/utils/constants';
  import { validateEmailInString } from '$lib/utils/functions/validator';
  import { triggerSendEmail, NOTIFICATION_NAME } from '$lib/utils/services/notification/notification';

  import { Badge } from '@cio/ui/base/badge';
  import { Input } from '@cio/ui/base/input';
  import { Button } from '@cio/ui/base/button';
  import { ComingSoon, UpgradeBanner } from '$lib/features/ui';
  import * as Field from '@cio/ui/base/field';

  let emailsStr = $state('');
  let errorMessage = $state('');
  let role = $state(ROLE.TUTOR.toString());
  let isFetching = $state(false);
  let isLoading = $state(false);
  let isRemoving: number | null = $state(null);

  async function onSendInvite() {
    const { hasError, error: _error, emails } = validateEmailInString(emailsStr);

    if (hasError) {
      errorMessage = _error;
      return;
    }

    isLoading = true;
    let apiError = '';
    emails.forEach(async (email: string, index: number) => {
      if (apiError) return;

      const doesEmailExist = $orgTeam.some((teamMember) => teamMember.email.toLowerCase() === email.toLowerCase());

      if (doesEmailExist) {
        snackbar.error('snackbar.team_members.user_exists');
        isLoading = false;
        return;
      }
      const { data, error } = await supabase
        .from('organizationmember')
        .insert({
          organization_id: $currentOrg.id,
          email,
          role_id: role,
          verified: false
        })
        .select();
      console.log('data', data);

      if (error) {
        apiError = `${error}`;

        console.error('onSendInvite:', error);
        snackbar.error(`snackbar.team_members.invite_fail`);
        isLoading = false;
        return;
      }
      const [newMember] = data || [];
      if (newMember) {
        orgTeam.update((team) => [
          {
            id: newMember.id,
            email: newMember?.email,
            fullname: newMember?.fullname || '',
            verified: newMember?.verified,
            role: ROLE_LABEL[newMember?.role_id] || '',
            isAdmin: newMember?.role_id === ROLE.ADMIN
          },
          ...team
        ]);
      }

      triggerSendEmail(NOTIFICATION_NAME.INVITE_TEACHER, {
        email: newMember.email,
        org: {
          id: $currentOrg.id,
          name: $currentOrg.name,
          siteName: $currentOrg.siteName
        }
      });

      const isLast = index === emails.length - 1;
      if (isLast) {
        snackbar.success('snackbar.team_members.invite_sent');

        emailsStr = '';
        isLoading = false;
      }
    });
  }

  async function onRemove(id: number) {
    console.log('onRemove called');
    isRemoving = id;
    const { error } = await supabase.from('organizationmember').delete().match({ id });

    if (error) {
      console.error('onRemove:', error);
      snackbar.error('snackbar.team_members.remove_fail');
    } else {
      orgTeam.update((team) => [...team.filter((member) => member.id !== id)]);
    }

    isRemoving = null;
  }

  const fetchTeam = (id: string) => {
    if (!id) return;

    untrack(async () => {
      isFetching = true;
      await getOrgTeam(id);
      isFetching = false;
      isFetching = false;
    });
  };

  const isTeamMemberAdmin = (members: OrgTeamMember[], profileId: string | undefined) => {
    return members.some((member) => member.profileId === profileId && member.isAdmin);
  };

  $effect(() => {
    fetchTeam($currentOrg.id);
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

      <Button variant="default" onclick={onSendInvite} loading={isLoading} disabled={isLoading || $isFreePlan}>
        {$t('course.navItem.people.teams.send_invite')}
      </Button>
    </Field.Group>
  </Field.Set>

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('course.navItem.people.teams.members')}</Field.Legend>
    <Field.Group>
      {#if isFetching}
        <Spinner class="size-10! text-blue-700!" />
      {:else}
        {#each $orgTeam as teamMember}
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
              {#if teamMember.profileId !== $profile.id && isTeamMemberAdmin($orgTeam, $profile.id)}
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
