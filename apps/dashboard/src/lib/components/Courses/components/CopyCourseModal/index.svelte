<script lang="ts">
  import { preventDefault } from '$lib/utils/functions/svelte';

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
  import { t } from '$lib/utils/functions/translations';

  // clone, show spinner and redirect to new course
  async function createCourse() {
    // Prevent double submission (Option 1: Early Return Guard)
    if ($copyCourseModal.isSaving) return;

    console.log('Create course');
    $copyCourseModal.isSaving = true;

    try {
      // Generate unique slug from the title
      const slug = generateSlug($copyCourseModal.title);

      const response = await classroomio.course.clone.$post({
        json: {
          id: $copyCourseModal.id,
          title: $copyCourseModal.title,
          description: $copyCourseModal.description,
          slug,
          organizationId: $currentOrg.id
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || $t('courses.copy_course.error.failed_to_clone'));
      }

      // Option 3: Close modal and reset state before navigation
      copyCourseModal.set(copyCourseModalInitialState);

      // Navigate to the new course
      goto(`/courses/${result.course.id}`);
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
  modalHeading={$t('courses.copy_course.title')}
>
  <form onsubmit={preventDefault(createCourse)}>
    <TextField
      label={$t('courses.copy_course.course_name_label')}
      bind:value={$copyCourseModal.title}
      autoFocus={true}
      placeholder={$t('courses.copy_course.course_name_placeholder')}
      className="mb-4"
      isRequired={true}
      autoComplete={false}
    />

    <TextArea
      label={$t('courses.copy_course.course_description_label')}
      bind:value={$copyCourseModal.description}
      placeholder={$t('courses.copy_course.course_description_placeholder')}
      className="mb-4"
      rows={4}
    />

    <div class="mt-5 flex flex-row-reverse items-center">
      <PrimaryButton
        className="px-6 py-3"
        label={$t('courses.copy_course.create_button')}
        type="submit"
        isLoading={$copyCourseModal.isSaving}
      />
    </div>
  </form>
</Modal>
