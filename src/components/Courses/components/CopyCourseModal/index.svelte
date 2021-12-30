<script>
  import { goto } from '@sapper/app';
  import PrimaryButton from '../../../PrimaryButton/index.svelte';
  import Modal from '../../../Modal/index.svelte';
  import { snackbarStore } from '../../../Snackbar/store';
  import { SNACKBAR_SEVERITY } from '../../../Snackbar/constants';
  import TextField from '../../../Form/TextField.svelte';
  import { copyCourseModalInitialState, copyCourseModal } from '../../store';
  import { cloneCourse } from '../../../../utils/services/courses/clone';

  // clone, show spinner and redirect to new course
  async function createCourse() {
    console.log('Create course');
    $copyCourseModal.isSaving = true;

    try {
      const newCourse = await cloneCourse(
        $copyCourseModal.id,
        $copyCourseModal.title
      );

      goto(`/courses/${newCourse.id}`);

      copyCourseModal.set(copyCourseModalInitialState);
    } catch (error) {
      console.error(error);

      // IIFI of snackbarStore to Show notification error
      (() => {
        $snackbarStore.message = "Something's not right - Please try later";
        $snackbarStore.severity = SNACKBAR_SEVERITY.ERROR;
        $snackbarStore.open = true;
      })();

      // Stop loader
      $copyCourseModal.isSaving = false;
    }
  }
</script>

<Modal
  onClose={() => ($copyCourseModal.open = false)}
  bind:open={$copyCourseModal.open}
  width="w-96"
  modalHeading="Create a Course"
>
  <form on:submit|preventDefault={createCourse}>
    <TextField
      label="Course name"
      bind:value={$copyCourseModal.title}
      autoFocus={true}
      placeholder="Your course name"
      className="mb-4"
      isRequired={true}
      autoComplete={false}
    />

    <div class="mt-5 flex items-center flex-row-reverse">
      <PrimaryButton
        className="px-6 py-2"
        label="Create"
        type="submit"
        isLoading={$copyCourseModal.isSaving}
      />
    </div>
  </form>
</Modal>
