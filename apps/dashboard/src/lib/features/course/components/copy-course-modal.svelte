<script lang="ts">
  import { preventDefault } from '$lib/utils/functions/svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import Modal from '$lib/components/Modal/index.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import TextArea from '$lib/components/Form/TextArea.svelte';
  import { copyCourseModal } from '$lib/features/course/utils/store';
  import { courseCloneApi } from '$lib/features/course/api';
  import { t } from '$lib/utils/functions/translations';

  async function createCourse() {
    if ($copyCourseModal.isSaving || courseCloneApi.isLoading) return;

    await courseCloneApi.clone($copyCourseModal.id, $copyCourseModal.title, $copyCourseModal.description);
  }

  // Sync loading state with modal store
  $effect(() => {
    $copyCourseModal.isSaving = courseCloneApi.isLoading;
  });
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
      errorMessage={courseCloneApi.errors.title}
    />

    <TextArea
      label={$t('courses.copy_course.course_description_label')}
      bind:value={$copyCourseModal.description}
      placeholder={$t('courses.copy_course.course_description_placeholder')}
      className="mb-4"
      rows={4}
      errorMessage={courseCloneApi.errors.description}
    />

    {#if courseCloneApi.errors.general}
      <div class="mb-4 text-sm text-red-600">{courseCloneApi.errors.general}</div>
    {/if}

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
