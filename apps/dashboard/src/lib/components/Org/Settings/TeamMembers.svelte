<script lang="ts">
  import { untrack } from 'svelte';
  import { Label } from '@cio/ui/base/label';
  import * as Select from '@cio/ui/base/select';
  import { Circle } from 'svelte-loading-spinners';

  import { profile } from '$lib/utils/store/user';
  import { isFreePlan } from '$lib/utils/store/org';
  import { getOrgTeam } from '$lib/utils/services/org';
  import { t } from '$lib/utils/functions/translations';
  import { supabase } from '$lib/utils/functions/supabase';
  import { snackbar } from '$lib/components/Snackbar/store';
  import type { OrgTeamMember } from '$lib/utils/types/org';
  import { currentOrg, orgTeam } from '$lib/utils/store/org';
  import { ROLE_LABEL } from '$lib/utils/constants/roles';
  import { ROLE } from '@cio/utils/constants';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { validateEmailInString } from '$lib/utils/functions/validator';
  import { triggerSendEmail, NOTIFICATION_NAME } from '$lib/utils/services/notification/notification';

  import { Row, Grid, Column } from './Layout';
  import SectionTitle from '../SectionTitle.svelte';
  import TextChip from '$lib/components/Chip/Text.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import ComingSoon from '$lib/components/ComingSoon/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';

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

<Grid class="relative mt-5 w-full rounded border border-gray-200 dark:border-neutral-600">
  <Row class="border-bottom-c py-7">
    <Column sm={4} md={4} lg={4} class="text-lg"
      ><SectionTitle>{$t('course.navItem.people.teams.add')}</SectionTitle></Column
    >
    <Column sm={8} md={8} lg={8}>
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

        <div class="mb-5">
          <Label class="mb-2 block">{$t('course.navItem.people.teams.role')}</Label>
          <Select.Root type="single" bind:value={role} disabled={$isFreePlan}>
            <Select.Trigger class="w-40">
              <p>{role ? $t(ROLE_LABEL[role]) : $t('course.navItem.people.teams.select_role')}</p>
            </Select.Trigger>
            <Select.Content>
              <Select.Item value={ROLE.ADMIN.toString()}>{$t(ROLE_LABEL[ROLE.ADMIN])}</Select.Item>
              <Select.Item value={ROLE.TUTOR.toString()}>{$t(ROLE_LABEL[ROLE.TUTOR])}</Select.Item>
            </Select.Content>
          </Select.Root>
        </div>

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
    <Column sm={4} md={4} lg={4} class="text-lg"
      ><SectionTitle>{$t('course.navItem.people.teams.members')}</SectionTitle></Column
    >
    <Column sm={8} md={8} lg={8}>
      {#if isFetching}
        <Circle />
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
