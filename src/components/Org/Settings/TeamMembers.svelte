<script>
  import {
    Grid,
    Row,
    Column,
    Select,
    SelectItem,
  } from 'carbon-components-svelte';
  import { Moon } from 'svelte-loading-spinners';
  import TextField from '../../Form/TextField.svelte';
  import TextChip from '../../Chip/Text.svelte';
  import ComingSoon from '../../ComingSoon/index.svelte';
  import PrimaryButton from '../../PrimaryButton/index.svelte';
  import { VARIANTS } from '../../PrimaryButton/constants';
  import { validateEmailInString } from '../../../utils/functions/validator';
  import { ROLE_LABEL, ROLE } from '../../../utils/constants/roles';
  import { currentOrg, orgTeam } from '../../../utils/store/org';
  import { snackbarStore } from '../../Snackbar/store';
  import { SNACKBAR_SEVERITY } from '../../Snackbar/constants';
  import { getOrgTeam } from '../../../utils/services/org';
  import { profile } from '../../../utils/store/user';
  import { supabase } from '../../../utils/functions/supabase';
  import SectionTitle from '../SectionTitle.svelte';

  let emailsStr = '';
  let errorMessage = '';
  let role = ROLE.ADMIN;
  let isFetching = false;
  let isLoading = false;
  let isRemoving = false;

  async function onSendInvite() {
    const {
      hasError,
      error: _error,
      emails,
    } = validateEmailInString(emailsStr);

    if (hasError) {
      errorMessage = _error;
      return;
    }

    isLoading = true;
    let apiError = '';
    emails.forEach(async (email, index) => {
      if (apiError) return;
      const { data, error } = await supabase.from('organizationmember').insert({
        organization_id: $currentOrg.id,
        email,
        role_id: role,
        verified: false,
      });
      console.log('data', data);

      if (error) {
        apiError = error;
        console.error('onSendInvite:', error);
        $snackbarStore.open = true;
        $snackbarStore.message = `Failed to send invite, please try again`;
        $snackbarStore.severity = SNACKBAR_SEVERITY.ERROR;

        isLoading = false;
        return;
      }
      const [newMember] = data || [];

      if (newMember) {
        orgTeam.update((team) => [
          {
            id: newMember.id,
            email: newMember?.email,
            verified: newMember?.verified,
            role: ROLE_LABEL[newMember?.role_id] || '',
            isAdmin: newMember?.role_id === ROLE.ADMIN,
          },
          ...team,
        ]);
      }

      const isLast = index === emails.length - 1;
      if (isLast) {
        $snackbarStore.open = true;
        $snackbarStore.message = 'Success';
        $snackbarStore.severity = SNACKBAR_SEVERITY.SUCCESS;

        emailsStr = '';
        isLoading = false;
      }
    });
  }

  async function onRemove(id) {
    console.error('onRemove called');
    isRemoving = true;
    const { data, error } = await supabase
      .from('organizationmember')
      .delete()
      .match({ id });

    if (error) {
      console.error('onRemove:', error);
      $snackbarStore.open = true;
      $snackbarStore.message = `Failed to remove user, please try again`;
      $snackbarStore.severity = SNACKBAR_SEVERITY.ERROR;
    } else if (data) {
      orgTeam.update((team) => team.filter((member) => member.id !== id));
    }

    isRemoving = false;
  }

  const fetchTeam = async (id) => {
    if (!id) return;

    isFetching = true;
    await getOrgTeam(id);
    isFetching = false;
  };

  const isTeamMemberAdmin = (members, profileId) => {
    return members.some(
      (member) => member.profileId === profileId && member.isAdmin
    );
  };

  $: fetchTeam($currentOrg.id);
</script>

<Grid class="border rounded border-gray-200 w-full mt-5">
  <Row class="py-7 border-bottom-c">
    <Column sm={2} md={2} lg={4} class="text-lg"
      ><SectionTitle>Add</SectionTitle></Column
    >
    <Column sm={2} md={6} lg={8}>
      <p class="text-md text-gray-500 dark:text-gray-200 mb-5">
        Add your team mates or collaborators to your organization. Start working
        together
      </p>

      <div class="">
        <TextField
          label="Invite"
          placeholder="email comma separated"
          bind:value={emailsStr}
          className="mb-3"
          {errorMessage}
        />

        <Select labelText="Role" bind:selected={role} class="mb-5 w-40">
          <SelectItem value={ROLE.ADMIN} text={ROLE_LABEL[ROLE.ADMIN]} />
          <SelectItem value={ROLE.TUTOR} text={ROLE_LABEL[ROLE.TUTOR]} />
        </Select>

        <PrimaryButton
          label="Send Invite"
          onClick={onSendInvite}
          {isLoading}
          isDisabled={isLoading}
        />
      </div>
    </Column>
  </Row>

  <Row class="py-7 border-bottom-c">
    <Column sm={2} md={2} lg={4} class="text-lg"
      ><SectionTitle>Members</SectionTitle></Column
    >
    <Column sm={2} md={6} lg={8}>
      {#if isFetching}
        <Moon />
      {:else}
        {#each $orgTeam as teamMember}
          <div class="flex justify-between items-center mb-5">
            <div class="flex">
              <p class="text-sm text-gray-500 dark:text-gray-200 mr-3">
                {teamMember.email}
              </p>
              <TextChip
                value={teamMember.role}
                className="text-xs mr-3"
                size="sm"
              />
              {#if !teamMember.verified}
                <TextChip
                  value="Invite Sent"
                  className="text-xs bg-yellow-200 text-yellow-700"
                  size="sm"
                />
              {:else if teamMember.profileId === $profile.id}
                <ComingSoon label="You" />
              {/if}
            </div>
            {#if teamMember.profileId !== $profile.id && isTeamMemberAdmin($orgTeam, $profile.id)}
              <PrimaryButton
                label="Remove"
                variant={VARIANTS.TEXT_DANGER}
                onClick={() => onRemove(teamMember.id)}
                isLoading={isRemoving}
                isDisabled={isRemoving}
              />
            {/if}
          </div>
        {/each}
      {/if}
    </Column>
  </Row>
</Grid>
