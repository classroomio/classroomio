<script>
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import Modal from '$lib/components/Modal/index.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import TextArea from '$lib/components/Form/TextArea.svelte';
  import { courses, createCourseModal } from '$lib/components/Courses/store';
  import { validateForm } from '$lib/components/Courses/functions';
  import { ROLE } from '$lib/utils/constants/roles';
  import { addGroupMember } from '$lib/utils/services/courses';
  import { supabase } from '$lib/utils/functions/supabase';
  import { profile } from '$lib/utils/store/user';
  import { currentOrg } from '$lib/utils/store/org';

  let errors = {
    title: '',
    description: ''
  };

  async function createCourse(e) {
    const { hasError, fieldErrors } = validateForm($createCourseModal);

    errors = fieldErrors;
    if (hasError) return;

    const { title, description } = $createCourseModal;
    // 1. Create group
    const { data: newGroup } = await supabase
      .from('group')
      .insert({ name: title, description, organization_id: $currentOrg.id })
      .select();

    console.log(`newGroup`, newGroup);
    const { id: group_id } = newGroup[0];

    // 2. Create course with group_id
    const { data: newCourse } = await supabase
      .from('course')
      .insert({
        title,
        description,
        group_id
      })
      .select();
    console.log(`newCourse`, newCourse);

    courses.update((_courses) => [..._courses, newCourse[0]]);

    // 3. Add group members

    // Get profile of author and add as member
    await addGroupMember({
      profile_id: $profile.id,
      email: $profile.email,
      group_id,
      role_id: ROLE.TUTOR
    });

    $createCourseModal.open = false;
  }
</script>

<svelte:head>
  <title>Create a new course</title>
</svelte:head>

<Modal
  onClose={() => ($createCourseModal.open = false)}
  bind:open={$createCourseModal.open}
  width="w-4/5 md:w-2/5"
  modalHeading="Create a Course"
>
  <form on:submit|preventDefault={createCourse}>
    <TextField
      label="Course name"
      bind:value={$createCourseModal.title}
      autoFocus={true}
      placeholder="Your course name"
      className="mb-4"
      isRequired={true}
      errorMessage={errors.title}
      autoComplete={false}
    />
    <TextArea
      label="Short description"
      bind:value={$createCourseModal.description}
      rows="4"
      maxRows="4"
      placeholder="A little description about this course"
      className="mb-4"
      isRequired={true}
      errorMessage={errors.description}
    />

    <div class="mt-5 flex items-center">
      <PrimaryButton className="px-6 py-3" label="Finish" type="submit" />
    </div>
  </form>
</Modal>
