<script>
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
  import { snackbarStore } from '$lib/components/Snackbar/store';
  import { SNACKBAR_SEVERITY } from '$lib/components/Snackbar/constants';
  import { getOrgTeam } from '$lib/utils/services/org';
  import { profile } from '$lib/utils/store/user';
  import { supabase } from '$lib/utils/functions/supabase';
  import SectionTitle from '../SectionTitle.svelte';
  import { sendInvite } from './utils';

  let emailsStr = '';
  let errorMessage = '';
  let role = ROLE.TUTOR;
  let isFetching = false;
  let isLoading = false;
  let isRemoving = false;

  async function onSendInvite() {
    const { hasError, error: _error, emails } = validateEmailInString(emailsStr);

    if (hasError) {
      errorMessage = _error;
      return;
    }

    isLoading = true;
    let apiError = '';
    emails.forEach(async (email, index) => {
      if (apiError) return;
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
            isAdmin: newMember?.role_id === ROLE.ADMIN
          },
          ...team
        ]);
      }

      // Send email invite
      sendInvite(email, {
        id: $currentOrg.id,
        name: $currentOrg.name,
        siteName: $currentOrg.siteName
      });

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
    console.log('onRemove called');
    isRemoving = true;
    const { data, error } = await supabase.from('organizationmember').delete().match({ id });

    if (error) {
      console.error('onRemove:', error);
      $snackbarStore.open = true;
      $snackbarStore.message = `Failed to remove user, please try again`;
      $snackbarStore.severity = SNACKBAR_SEVERITY.ERROR;
    } else {
      orgTeam.update((team) => [...team.filter((member) => member.id !== id)]);
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
    return members.some((member) => member.profileId === profileId && member.isAdmin);
  };

  $: fetchTeam($currentOrg.id);
</script>

<Grid class="border rounded border-gray-200 w-full mt-5">
  <Row class="py-7 border-bottom-c">
    <Column sm={2} md={2} lg={4} class="text-lg"><SectionTitle>Add</SectionTitle></Column>
    <Column sm={2} md={6} lg={8}>
      <p class="text-md text-gray-500 dark:text-white mb-5">
        Add your team mates or collaborators to your organization. Start working together
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
          <!-- <SelectItem value={ROLE.ADMIN} text={ROLE_LABEL[ROLE.ADMIN]} /> -->
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
    <Column sm={2} md={2} lg={4} class="text-lg"><SectionTitle>Members</SectionTitle></Column>
    <Column sm={2} md={6} lg={8}>
      {#if isFetching}
        <Moon />
      {:else}
        {#each $orgTeam as teamMember}
          <div class="flex justify-between items-center mb-5">
            <div class="flex">
              <p class="text-sm text-gray-500 dark:text-white mr-3">
                {teamMember.email}
              </p>
              <TextChip value={teamMember.role} className="text-xs mr-3" size="sm" />
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
