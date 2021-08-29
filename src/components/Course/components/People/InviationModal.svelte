<script>
  import Modal from '../../../Modal/index.svelte';
  import PrimaryButton from '../../../PrimaryButton/index.svelte';
  import TextArea from '../../../Form/TextArea.svelte';
  import { ROLE } from '../../../../utils/constants/roles';
  import {
    addGroupMember,
    fetchGroup,
  } from '../../../../utils/services/courses';
  import { invitationModal, resetForm } from './store';
  import { validateForm } from '../../../Courses/functions';
  import { course, setCourseData } from '../../../Course/store';

  let errors = {
    emails: '',
  };

  function addPerson() {
    const { hasError, fieldErrors, students, tutors } = validateForm({
      ...$invitationModal,
      title: 'sfdsd',
      description: 'dsfdsf',
    });

    errors = fieldErrors;
    if (hasError) return;

    let membersStack = [];
    console.log(`$course`, $course);
    // Create groupmemebers from group_id and add teachers and students
    for (const student of students) {
      membersStack.push({
        email: student,
        group_id: $course.group.id,
        role_id: ROLE.STUDENT,
      });
    }

    for (const tutor of tutors) {
      membersStack.push({
        email: tutor,
        group_id: $course.group.id,
        role_id: ROLE.TUTOR,
      });
    }

    addGroupMember(membersStack).then(async (membersAdded) => {
      const group = await fetchGroup($course.group.id);

      setCourseData(
        {
          ...$course,
          group: group.data,
        },
        false
      );

      resetForm();
    });
  }
</script>

<Modal
  onClose={resetForm}
  bind:open={$invitationModal.open}
  width="w-2/5"
  maxWidth="max-w-lg"
  modalHeading="Invite people"
>
  <form on:submit|preventDefault={addPerson}>
    <TextArea
      label="Invite Tutors"
      bind:value={$invitationModal.tutors}
      rows="2"
      maxRows="3"
      placeholder="tutor@company.com, john@gmail.com"
      helperMessage="To invite people, add their emails separated by a comma"
      errorMessage={errors.tutors}
      className="mb-4"
    />
    <TextArea
      label="Invite Students"
      bind:value={$invitationModal.students}
      rows="2"
      maxRows="3"
      placeholder="student@gmail.com, john@gmail.com"
      helperMessage="To invite people, add their emails separated by a comma"
      errorMessage={errors.students}
      className="mb-4"
    />

    <div class="mt-5 flex items-center">
      <PrimaryButton className="px-6 py-2" label="Finish" type="submit" />
    </div>
  </form>
</Modal>
