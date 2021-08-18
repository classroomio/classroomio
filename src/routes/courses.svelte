<script context="module">
  import { supabase } from '../utils/functions/supabase';

  export async function preload(page, params) {
    const user = JSON.parse(params.user);

    const { data: orgMember } = await supabase
      .from('organizationmember')
      .select(`organization_id`)
      .eq('profile_id', user.id)
      .single();

    const { data: allCourses } = await supabase
      .from('course')
      .select(`id, title, description`)
      .eq('organization_id', orgMember.organization_id);

    return { allCourses, organizationId: orgMember.organization_id };
  }
</script>

<script>
  import { onMount } from 'svelte';
  // import { stores } from '@sapper/app';
  import PageNav from '../components/PageNav/index.svelte';
  import Courses from '../components/Courses/index.svelte';
  import PrimaryButton from '../components/PrimaryButton/index.svelte';
  import Modal from '../components/Modal/index.svelte';
  import TextField from '../components/Form/TextField.svelte';
  import TextArea from '../components/Form/TextArea.svelte';
  import { courses, createCourseModal } from '../components/Courses/store';
  import { validateForm } from '../components/Courses/functions';
  import { profile } from '../utils/store/user';
  import { ROLE } from '../utils/constants/roles';

  // const { page } = stores();

  export let allCourses;
  export let organizationId;

  let errors = {
    emails: '',
  };

  // let tab = '';

  async function createCourse(e) {
    const { hasError, fieldErrors, students, tutors } =
      validateForm($createCourseModal);

    errors = fieldErrors;
    if (hasError) return;

    const { title, description } = $createCourseModal;
    // Create group from course_id
    const { data: newGroup } = await supabase
      .from('group')
      .insert({ name: title, description });

    console.log(`newGroup`, newGroup);
    const { id: group_id } = newGroup[0];

    // Create course with group_id
    const { data: newCourse } = await supabase.from('course').insert({
      title,
      description,
      group_id,
      organization_id: organizationId,
    });

    // Get profile of author and add as member
    const admin = await addGroupMember({
      profile_id: $profile.id,
      group_id,
      role_id: ROLE.ADMIN,
    });

    let membersStack = [];

    // Create groupmemebers from group_id and add teachers and students
    for (const student of students) {
      membersStack.push({
        email: student,
        group_id,
        role_id: ROLE.STUDENT,
      });
    }

    for (const tutor of tutors) {
      membersStack.push({
        email: tutor,
        group_id,
        role_id: ROLE.TUTOR,
      });
    }

    addGroupMember(membersStack).then((membersAdded) => {
      console.log(`membersAdded`, membersAdded);
    });
  }

  function addGroupMember(member) {
    return supabase.from('groupmember').insert(member, {
      returning: 'minimal',
    });
  }

  onMount(() => {
    courses.set(allCourses);
  });
  // $: tab = $page.query.tab || 'mine';
</script>

<svelte:head>
  <title>Courses</title>
</svelte:head>

<div class="root">
  <PageNav title="Courses">
    <div slot="widget">
      <PrimaryButton
        label="New"
        onClick={() => ($createCourseModal.open = true)}
      />
    </div>
  </PageNav>

  <Modal
    onClose={() => ($createCourseModal.open = false)}
    bind:open={$createCourseModal.open}
    width="w-2/5"
    modalHeading="Create a Course"
  >
    <form on:submit|preventDefault={createCourse}>
      <TextField
        label="Course name"
        bind:value={$createCourseModal.title}
        autofocus={true}
        placeholder="Your course name"
        className="mb-4"
        isRequired={true}
        errorMessage={errors.title}
        autoComplete={false}
      />
      <TextArea
        label="Invite Tutors"
        bind:value={$createCourseModal.tutors}
        rows="2"
        maxRows="3"
        placeholder="tutor@company.com, john@gmail.com"
        helperMessage="To invite people, add their emails separated by a comma"
        errorMessage={errors.tutors}
        className="mb-4"
      />
      <TextArea
        label="Invite Students"
        bind:value={$createCourseModal.students}
        rows="2"
        maxRows="3"
        placeholder="student@gmail.com, john@gmail.com"
        helperMessage="To invite people, add their emails separated by a comma"
        errorMessage={errors.students}
        className="mb-4"
      />
      <TextArea
        label="Short description"
        bind:value={$createCourseModal.description}
        rows="4"
        maxRows="4"
        placeholder="A little description about this course"
        className="mb-4"
        isRequired={true}
      />

      <div class="mt-5 flex items-center">
        <PrimaryButton className="px-6 py-2" label="Finish" type="submit" />
      </div>
    </form>
  </Modal>

  <Courses />
</div>

<style>
  .root {
    min-width: 600px;
    margin: 0 auto;
    border-left: 1px solid var(--border-color);
    border-right: 1px solid var(--border-color);
  }
</style>
