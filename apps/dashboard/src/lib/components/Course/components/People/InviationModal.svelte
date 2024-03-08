<script lang="ts">
  import { Popover } from 'carbon-components-svelte';
  import Link from 'carbon-icons-svelte/lib/Link.svelte';
  import Modal from '$lib/components/Modal/index.svelte';
  import copy from 'copy-to-clipboard';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { ROLE } from '$lib/utils/constants/roles';
  import { addGroupMember, fetchGroup } from '$lib/utils/services/courses';
  import { invitationModal, resetForm } from './store';
  import { course, setCourse } from '$lib/components/Course/store';
  import { MultiSelect, Loading } from 'carbon-components-svelte';
  import { currentOrg, currentOrgDomain } from '$lib/utils/store/org';
  import { getOrgTeam } from '$lib/utils/services/org';
  import type { OrgTeamMember } from '$lib/utils/types/org';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { getStudentInviteLink } from '$lib/utils/functions/course';
  import {
    triggerSendEmail,
    NOTIFICATION_NAME
  } from '$lib/utils/services/notification/notification';
  import { snackbar } from '$lib/components/Snackbar/store';
  import { t } from '$lib/utils/functions/translations';

  interface Tutor {
    id: number;
    text: string;
    email: string;
    profileId?: string;
  }
  let tutors: Tutor[] = [];
  let selectedIds: Array<number> = [];
  let selectedTutors: Tutor[] = [];
  let isLoadingTutors = false;
  let copied = false;

  function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
    return value !== null && value !== undefined;
  }
  const formatSelected = (i: Array<number>): Tutor[] =>
    i.length === 0 ? [] : i.map((id) => tutors.find((tutor) => tutor.id === id)).filter(notEmpty);

  function onSubmit() {
    if (!selectedTutors.length) {
      resetForm();
      return;
    }

    let membersStack = [];
    console.log(`$course`, $course);

    for (const tutor of selectedTutors) {
      membersStack.push({
        profile_id: tutor.profileId,
        group_id: $course.group?.id,
        role_id: ROLE.TUTOR
      });

      triggerSendEmail(NOTIFICATION_NAME.WELCOME_TEACHER_TO_COURSE, {
        to: tutor.email,
        name: tutor.text,
        orgName: $currentOrg.name,
        orgSiteName: $currentOrg.siteName,
        courseName: $course.title
      });
    }

    addGroupMember(membersStack).then(async (membersAdded) => {
      if (!$course?.group?.id) return;

      const group = await fetchGroup($course?.group?.id);

      setCourse(
        {
          ...$course,
          group: group.data
        },
        false
      );

      resetForm();
    });
  }

  function getTutors(team: OrgTeamMember[]) {
    const existingTutors = $course.group?.tutors || [];
    return team
      .filter((teamMember) => teamMember.verified)
      .filter((teamMember) => {
        // filter out teamMembers that have already been added
        return !existingTutors.some((t) => t.id === teamMember.profileId);
      })
      .map((teamMember) => ({
        id: teamMember.id,
        text: teamMember.fullname,
        profileId: teamMember.profileId,
        email: teamMember.email
      }));
  }

  async function setTutors(orgId: string | undefined, _open: boolean) {
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

  function copyLink() {
    if (!$currentOrgDomain) {
      snackbar.error('Org data missing, please reload the page');
      console.error('No current org domain');
      return;
    }

    const link = getStudentInviteLink($course, $currentOrg.siteName, $currentOrgDomain);
    copy(link);
    copied = true;
    setTimeout(() => {
      copied = false;
    }, 1000);
  }

  $: {
    selectedTutors = formatSelected(selectedIds);
    console.log('selectedTutors', selectedTutors);
  }

  $: setTutors($currentOrg.id, $invitationModal.open);
</script>

<Modal
  onClose={resetForm}
  bind:open={$invitationModal.open}
  width="w-4/5 md:w-2/5"
  maxWidth="max-w-lg"
  modalHeading={$t('course.navItem.people.invite_modal.title')}
>
  <form on:submit|preventDefault={onSubmit}>
    <div class="mb-8">
      <p class="text-base mb-1 font-semibold">{$t('course.navItem.people.invite_modal.invite')}</p>
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
            class="underline text-primary-600"
          >
            {$t('course.navItem.people.invite_modal.go_to')}
          </a>
        </span>
      {/if}
    </div>

    <div class="mb-8 w-[90%] flex justify-between items-center">
      <div class="w-3/5">
        <p class="text-base mb-1 font-semibold">
          {$t('course.navItem.people.invite_modal.invite_students')}
        </p>
        <p class=" text-sm">{$t('course.navItem.people.invite_modal.via_link')}</p>
      </div>

      <div class="relative">
        <PrimaryButton
          disablePadding={true}
          className="text-sm py-2 px-3"
          variant={VARIANTS.OUTLINED}
          onClick={copyLink}
        >
          <Link size={16} class="mr-1" />
          {$t('course.navItem.people.invite_modal.copy_link')}
        </PrimaryButton>
        <Popover caret open={copied} align="bottom">
          <div style="padding: 5px">{$t('course.navItem.people.invite_modal.success')}</div>
        </Popover>
      </div>
    </div>

    <div class="mt-5 flex items-center flex-row-reverse">
      <PrimaryButton
        className="px-6 py-3"
        label={$t('course.navItem.people.invite_modal.finish')}
        type="submit"
      />
    </div>
  </form>
</Modal>
