<script lang="ts">
  import { goto } from '$app/navigation';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import Modal from '$lib/components/Modal/index.svelte';
  import { snackbar } from '$lib/components/Snackbar/store';
  import TextField from '$lib/components/Form/TextField.svelte';
  import TextArea from '$lib/components/Form/TextArea.svelte';
  import { copyCourseModalInitialState, copyCourseModal } from '$lib/components/Courses/store';
  import { classroomio } from '$lib/utils/services/api';
  import generateSlug from '$lib/utils/functions/generateSlug';
  import { currentOrg } from '$lib/utils/store/org';

  // clone, show spinner and redirect to new course
  async function createCourse() {
    // Prevent double submission (Option 1: Early Return Guard)
    if ($copyCourseModal.isSaving) return;

    console.log('Create course');
    $copyCourseModal.isSaving = true;

    try {
      // Generate unique slug from the new title
      const newSlug = generateSlug($copyCourseModal.title);

      const response = await classroomio.course.clone.$post({
        json: {
          courseId: $copyCourseModal.id,
          newTitle: $copyCourseModal.title,
          newDescription: $copyCourseModal.description,
          newSlug,
          organizationId: $currentOrg.id
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error((result as any).error  || 'Failed to clone course');
      }

      // Option 3: Close modal and reset state before navigation
      copyCourseModal.set(copyCourseModalInitialState);
      
      // Navigate to the new course
      goto(`/courses/${(result as any).course.id}`);
      $copyCourseModal.open = false;
    } catch (error) {
      console.error(error);

      // IIFI of snackbar to Show notification error
      (() => {
        snackbar.error();
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

    <TextArea
      label="Course description"
      bind:value={$copyCourseModal.description}
      placeholder="Enter a description for your course"
      className="mb-4"
      rows={4}
    />

    <div class="mt-5 flex flex-row-reverse items-center">
      <PrimaryButton
        className="px-6 py-3"
        label="Create"
        type="submit"
        isLoading={$copyCourseModal.isSaving}
        isDisabled={$copyCourseModal.isSaving}
      />
    </div>
  </form>
</Modal>
