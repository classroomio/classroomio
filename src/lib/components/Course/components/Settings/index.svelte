<script>
  import { goto } from '$app/navigation';
  import Modal from '$lib/components/Modal/index.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import TextArea from '$lib/components/Form/TextArea.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import UploadImage from '$lib/components/UploadImage/index.svelte';

  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { settingsDialog } from './store';
  import { course } from '$lib/components/Course/store';
  import { updateCourse, deleteCourse } from '$lib/utils/services/courses';

  let shouldDelete = false;
  let avatar;
  let errors = {};

  async function updateDescription() {
    if (!$course.title) {
      errors.title = 'Title cannot be empty';
      return;
    }
    if (!$course.description) {
      errors.description = 'Description cannot be empty';
      return;
    }

    $settingsDialog.open = false;
    const logo = await updateCourse($course.id, avatar, {
      title: $course.title,
      description: $course.description,
    });

    if (logo) {
      $course.logo = logo;
    }

    avatar = undefined;
  }

  async function handleDelete() {
    $settingsDialog.open = false;
    await deleteCourse($course.id);
    goto('/courses');
  }

  // function setAvatar(logo) {
  //   avatar = logo;
  // }

  // $: setAvatar($course.logo);
</script>

<Modal
  onClose={() => ($settingsDialog.open = false)}
  bind:open={$settingsDialog.open}
  width="w-96"
  modalHeading="Update Course"
>
  {#if shouldDelete}
    <form on:submit|preventDefault={() => (shouldDelete = false)}>
      <h1 class="dark:text-white text-2xl">Are you sure?</h1>

      <div class="mt-5 flex items-center justify-between">
        <PrimaryButton
          className="px-6 py-3"
          variant={VARIANTS.OUTLINED}
          label="No, cancel"
          type="submit"
        />
        <PrimaryButton
          className="px-6 py-3"
          variant={VARIANTS.OUTLINED}
          label="Yes, delete"
          onClick={handleDelete}
        />
      </div>
    </form>
  {:else}
    <form on:submit|preventDefault={updateDescription}>
      <UploadImage bind:avatar src={$course.logo} />
      <TextField
        bind:value={$course.title}
        placeholder="Course title"
        className="mb-4"
        isRequired={true}
        errorMessage={errors.title}
      />
      <TextArea
        label="Short description"
        bind:value={$course.description}
        rows="4"
        maxRows="4"
        placeholder="A little description about this course"
        className="mb-4"
        isRequired={true}
        errorMessage={errors.description}
      />

      <div class="mt-5 flex items-center justify-between">
        <PrimaryButton
          className="px-6 py-3"
          variant={VARIANTS.CONTAINED_DANGER}
          label="Delete"
          onClick={() => (shouldDelete = true)}
        />
        <PrimaryButton className="px-6 py-3" label="Update" type="submit" />
      </div>
    </form>
  {/if}
</Modal>
