<script lang="ts">
  import { preventDefault } from '$lib/utils/functions/svelte';
  import { Button } from '@cio/ui/base/button';
  import * as Dialog from '@cio/ui/base/dialog';
  import { InputField } from '@cio/ui/custom/input-field';
  import { TextareaField } from '@cio/ui/custom/textarea-field';
  import { copyCourseModal } from '$features/course/utils/store';
  import { courseCloneApi } from '$features/course/api';
  import { t } from '$lib/utils/functions/translations';

  async function createCourse() {
    if (courseCloneApi.isLoading) return;

    await courseCloneApi.clone($copyCourseModal.id, $copyCourseModal.title, $copyCourseModal.description);
  }
</script>

<Dialog.Root bind:open={$copyCourseModal.open}>
  <Dialog.Content class="w-96">
    <Dialog.Header>
      <Dialog.Title>{$t('courses.copy_course.title')}</Dialog.Title>
    </Dialog.Header>
    <form onsubmit={preventDefault(createCourse)}>
      <InputField
        label={$t('courses.copy_course.course_name_label')}
        bind:value={$copyCourseModal.title}
        autoFocus={true}
        placeholder={$t('courses.copy_course.course_name_placeholder')}
        className="mb-4"
        isRequired={true}
        autoComplete={false}
        errorMessage={courseCloneApi.errors.title}
      />

      <TextareaField
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
        <Button type="submit" loading={$copyCourseModal.isSaving}>
          {$t('courses.copy_course.create_button')}
        </Button>
      </div>
    </form>
  </Dialog.Content>
</Dialog.Root>
