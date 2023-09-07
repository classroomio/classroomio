<script lang="ts">
  import Modal from '$lib/components/Modal/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import TextArea from '$lib/components/Form/TextArea.svelte';
  import { ROLE } from '$lib/utils/constants/roles';
  import { addGroupMember, fetchGroup } from '$lib/utils/services/courses';
  import { invitationModal, resetForm } from './store';
  import { validateForm } from '$lib/components/Courses/functions';
  import { course, setCourse } from '$lib/components/Course/store';
  import { MultiSelect, Loading } from 'carbon-components-svelte';
  import { currentOrg } from '$lib/utils/store/org';
  import { getOrgTeam } from '$lib/utils/services/org';
  import type { OrgTeamMember } from '$lib/utils/types/org';
  import { sendTeacherCourseWelcome } from './utils';

  let errors: {
    students: string;
    tutors: string;
    title?: string;
    description?: string;
  } = {
    students: '',
    tutors: ''
  };

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

  function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
    return value !== null && value !== undefined;
  }
  const formatSelected = (i: Array<number>): Tutor[] =>
    i.length === 0 ? [] : i.map((id) => tutors.find((tutor) => tutor.id === id)).filter(notEmpty);

  function onSubmit() {
    const { hasError, fieldErrors, students } = validateForm({
      ...$invitationModal,
      title: 'sfdsd',
      description: 'dsfdsf',
      tutors: 'sgsg'
    });

    errors = fieldErrors;
    if (hasError) return;

    let membersStack = [];
    console.log(`$course`, $course);

    // Create groupmemebers from group_id and add teachers and students
    for (const studentEmail of students) {
      membersStack.push({
        email: studentEmail,
        group_id: $course.group?.id,
        role_id: ROLE.STUDENT
      });
    }

    for (const tutor of selectedTutors) {
      membersStack.push({
        profile_id: tutor.profileId,
        group_id: $course.group?.id,
        role_id: ROLE.TUTOR
      });

      sendTeacherCourseWelcome({
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

  $: {
    selectedTutors = formatSelected(selectedIds);
    console.log('selectedTutors', selectedTutors);
  }

  $: setTutors($currentOrg.id, $invitationModal.open);
</script>

<Modal
  onClose={resetForm}
  bind:open={$invitationModal.open}
  width="w-2/5"
  maxWidth="max-w-lg"
  modalHeading="Invite people"
>
  <form on:submit|preventDefault={onSubmit}>
    <div class="mb-4">
      <p class="text-base mb-1">Invite Tutors</p>
      <MultiSelect
        disabled={isLoadingTutors}
        label="Select tutors in organization..."
        bind:selectedIds
        items={tutors}
      />
      {#if isLoadingTutors}
        <span>
          <Loading withOverlay={false} small />
        </span>
      {:else}
        <span>
          To add tutor to your organization,
          <a
            href={`/org/${$currentOrg.siteName}/settings/teams`}
            class="underline text-primary-600"
          >
            go to organization settings
          </a>
        </span>
      {/if}
    </div>

    <TextArea
      label="Invite Students"
      labelClassName="text-base"
      bind:value={$invitationModal.students}
      rows="2"
      maxRows={3}
      placeholder="student@gmail.com, john@gmail.com"
      helperMessage="To invite people, add their emails separated by a comma"
      errorMessage={errors.students}
      className="mb-4"
    />

    <div class="mt-5 flex items-center">
      <PrimaryButton className="px-6 py-3" label="Finish" type="submit" />
    </div>
  </form>
</Modal>
