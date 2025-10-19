<script lang="ts">
  import { untrack } from 'svelte';
  import { Grid, Row, Column, Select, SelectItem } from 'carbon-components-svelte';
  import { Moon } from 'svelte-loading-spinners';
  import TextField from '$lib/components/Form/TextField.svelte';
  import TextChip from '$lib/components/Chip/Text.svelte';
  import ComingSoon from '$lib/components/ComingSoon/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { validateEmailInString } from '$lib/utils/functions/validator';
  import { ROLE_LABEL, ROLE } from '$lib/utils/constants/roles';
  import { currentOrg, orgTeam } from '$lib/utils/store/org';
  import { snackbar } from '$lib/components/Snackbar/store';
  import { getOrgTeam } from '$lib/utils/services/org';
  import { profile } from '$lib/utils/store/user';
  import { supabase } from '$lib/utils/functions/supabase';
  import SectionTitle from '../SectionTitle.svelte';
  import { triggerSendEmail, NOTIFICATION_NAME } from '$lib/utils/services/notification/notification';
  import { isFreePlan } from '$lib/utils/store/org';
  import type { OrgTeamMember } from '$lib/utils/types/org';
  import { t } from '$lib/utils/functions/translations';

  let emailsStr = $state('');
  let errorMessage = $state('');
  let role = $state(ROLE.TUTOR);
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

<Grid class="relative mt-5 w-full rounded-sm border border-gray-200 dark:border-neutral-600">
  <Row class="border-bottom-c py-7">
    <Column sm={2} md={2} lg={4} class="text-lg"
      ><SectionTitle>{$t('course.navItem.people.teams.add')}</SectionTitle></Column
    >
    <Column sm={2} md={6} lg={8}>
      <p class="text-md mb-5 text-gray-500 dark:text-white">
        {$t('course.navItem.people.teams.add_team')}
      </p>

      <div class="">
        <TextField
          label={$t('course.navItem.people.teams.invite')}
          placeholder={$t('course.navItem.people.teams.placeholder')}
          bind:value={emailsStr}
          className="mb-3"
          isDisabled={$isFreePlan}
          {errorMessage}
        />

        <Select
          labelText={$t('course.navItem.people.teams.role')}
          bind:selected={role}
          class="mb-5 w-40"
          disabled={$isFreePlan}
        >
          <SelectItem value={ROLE.ADMIN} text={$t(ROLE_LABEL[ROLE.ADMIN])} />
          <SelectItem value={ROLE.TUTOR} text={$t(ROLE_LABEL[ROLE.TUTOR])} />
        </Select>

        <PrimaryButton
          label={$t('course.navItem.people.teams.send_invite')}
          onClick={onSendInvite}
          {isLoading}
          isDisabled={isLoading || $isFreePlan}
        />
      </div>
    </Column>
  </Row>

  <Row class="border-bottom-c py-7">
    <Column sm={2} md={2} lg={4} class="text-lg"
      ><SectionTitle>{$t('course.navItem.people.teams.members')}</SectionTitle></Column
    >
    <Column sm={2} md={6} lg={8}>
      {#if isFetching}
        <Moon />
      {:else}
        {#each $orgTeam as teamMember}
          <div class="mb-5 flex items-center justify-between">
            <div class="flex">
              <p class="mr-3 text-sm text-gray-500 dark:text-white">
                {teamMember.email}
              </p>
              <TextChip value={$t(teamMember.role)} className="text-xs mr-3" size="sm" />
              {#if !teamMember.verified}
                <TextChip
                  value={$t('course.navItem.people.teams.invite_sent')}
                  className="text-xs bg-yellow-200 text-yellow-700"
                  size="sm"
                />
              {:else if teamMember.profileId === $profile.id}
                <ComingSoon label={$t('course.navItem.people.teams.you')} />
              {/if}
            </div>
            {#if teamMember.profileId !== $profile.id && isTeamMemberAdmin($orgTeam, $profile.id)}
              <PrimaryButton
                label={$t('course.navItem.people.teams.remove')}
                variant={VARIANTS.TEXT_DANGER}
                onClick={() => onRemove(teamMember.id)}
                isLoading={isRemoving === teamMember.id}
                isDisabled={isRemoving === teamMember.id}
              />
            {/if}
          </div>
        {/each}
      {/if}
    </Column>
  </Row>
</Grid>
