<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { ROLE } from '$lib/utils/constants/roles';
  import { addGroupMember } from '$lib/utils/services/courses';
  import { MultiSelect, Loading } from 'carbon-components-svelte';
  import { currentOrg } from '$lib/utils/store/org';
  import { getOrgTeam } from '$lib/utils/services/org';
  import type { OrgTeamMember } from '$lib/utils/types/org';
  import { triggerSendEmail, NOTIFICATION_NAME } from '$lib/utils/services/notification';
  import { t } from '$lib/utils/functions/translations';
  import { ProductInviteService } from '$lib/utils/services/products/invite';
  import { supabase } from '$lib/utils/functions/supabase';
  import { snackbar } from '$lib/components/Snackbar/store';
  import Modal from '$lib/components/Modal/index.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import type { Course } from '$lib/utils/types';
  import { course } from '../../store';

  interface Tutor {
    id: number;
    text: string;
    email: string;
    profileId?: string;
  }

  let addPeopleParm;
  let tutors: Tutor[] = [];
  let selectedIds: Array<number> = [];
  let selectedTutors: Tutor[] = [];
  let isLoadingTutors = false;
  let emails = '';
  let emailsError = '';
  let isSaving = false;

  let group: Course['group'];

  function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
    return value !== null && value !== undefined;
  }
  const formatSelected = (i: Array<number>): Tutor[] =>
    i.length === 0 ? [] : i.map((id) => tutors.find((tutor) => tutor.id === id)).filter(notEmpty);

  async function inviteStudents(emailsArr: string[]) {
    const productInviteService = new ProductInviteService(supabase);

    const inviteResponse = await productInviteService.sendInvite(
      emailsArr.map((email) => ({
        email,
        items: [
          {
            productName: $course?.title || 'Course',
            type: 'course',
            groupId: group?.id || ''
          }
        ]
      })),
      $currentOrg
    );

    if (!inviteResponse) {
      return;
    }
    const { groupmembers } = inviteResponse;

    course.update((tp) => {
      if (!tp) return tp;

      const _group = { ...(tp.group || {}) };

      groupmembers.forEach((member) => {
        if (_group.members) {
          _group.members.push({
            id: member.id,
            role_id: member.role_id,
            email: member.email,
            group_id: _group.id ?? ''
          });
        }
      });

      return {
        ...tp,
        group: {
          ..._group,
          id: _group.id ?? '',
          name: _group.name ?? ''
        }
      } as Course;
    });

    snackbar.success('Invites sent successfully');

    emails = '';
  }

  async function onSubmit() {
    isSaving = true;

    if (emails) {
      inviteStudents(emails.split(',').map((email) => email.trim()));
    }

    if (!selectedTutors.length) {
      goto($page.url.pathname);

      isSaving = false;

      return;
    }

    let membersStack: { profile_id?: string; group_id?: string; role_id: number }[] = [];

    for (const tutor of selectedTutors) {
      membersStack.push({
        profile_id: tutor.profileId,
        group_id: group?.id,
        role_id: ROLE.TUTOR
      });

      triggerSendEmail(NOTIFICATION_NAME.WELCOME_TEACHER_TO_TESTPACK, {
        to: tutor.email,
        name: tutor.text,
        orgName: $currentOrg.name,
        orgSiteName: $currentOrg.siteName,
        testpackName: $course?.title
      });
    }

    await addGroupMember(membersStack);

    goto($page.url.pathname);

    isSaving = false;
  }

  function getExistingTutors(group: Course['group']) {
    return group?.members?.filter((member) => member.role_id === ROLE.TUTOR);
  }

  function getTutors(team: OrgTeamMember[]) {
    const existingTutors = getExistingTutors(group);
    return team
      .filter((teamMember) => teamMember.verified)
      .filter((teamMember) => {
        // filter out teamMembers that have already been added
        return !(existingTutors ?? []).some((t) => t.profile_id === teamMember.profileId);
      })
      .map((teamMember) => ({
        id: teamMember.id,
        text: teamMember.fullname,
        profileId: teamMember.profileId,
        email: teamMember.email
      }));
  }

  async function setTutors(orgId: string | undefined) {
    if (!orgId) return;

    isLoadingTutors = true;
    const { team, error } = await getOrgTeam(orgId);
    if (error) {
      console.error('Error fetching teams', error);
      isLoadingTutors = false;
      return;
    }

    tutors = getTutors(team);

    isLoadingTutors = false;
  }

  function closeModal() {
    goto($page.url.pathname);
  }

  $: {
    selectedTutors = formatSelected(selectedIds);
    const query = new URLSearchParams($page.url.search);
    addPeopleParm = query.get('add');
  }

  $: if ($course) {
    group = $course.group;
    setTutors($currentOrg.id);
  }
</script>

<Modal
  onClose={() => closeModal()}
  open={addPeopleParm === 'true'}
  width="w-4/5 md:w-2/5"
  maxWidth="max-w-lg"
  modalHeading={$t('course.navItem.people.invite_modal.title')}
>
  <form on:submit|preventDefault={onSubmit}>
    <div class="mb-8">
      <p class="mb-1 text-base font-semibold">
        {$t('course.navItem.people.invite_modal.invite')}
      </p>
      <MultiSelect
        disabled={isLoadingTutors}
        label={$t('course.navItem.people.invite_modal.select')}
        bind:selectedIds
        items={tutors}
      />
      {#if isLoadingTutors}
        <span>
          <Loading withOverlay={false} small />
        </span>
      {:else}
        <span>
          {$t('course.navItem.people.invite_modal.to_add')}
          <a
            href={`/org/${$currentOrg.siteName}/settings/teams`}
            class="text-primary-600 underline"
          >
            {$t('course.navItem.people.invite_modal.go_to')}
          </a>
        </span>
      {/if}
    </div>

    <div class="mb-8 w-full">
      <p class="mb-1 text-base font-semibold">Invite Students</p>

      <TextField
        label="Email addresses"
        className="w-full my-4"
        placeholder="john@example.com,jane@example.com"
        bind:value={emails}
        errorMessage={emailsError}
      />
    </div>

    <div class="mt-5 flex flex-row-reverse items-center">
      <PrimaryButton
        className="px-6 py-3"
        label={$t('course.navItem.people.invite_modal.finish')}
        isLoading={isSaving}
        isDisabled={isSaving}
        type="submit"
      />
    </div>
  </form>
</Modal>
