<script lang="ts">
  import { preventDefault } from '$lib/utils/functions/svelte';
  import { Button } from '@cio/ui/base/button';
  import * as Dialog from '@cio/ui/base/dialog';
  import { InputField } from '@cio/ui/custom/input-field';
  import { TextareaField } from '@cio/ui/custom/textarea-field';
  import { clonePathModal, clonePathModalInitialState } from '../utils/store';
  import { learningPathApi } from '../api';
  import { slugify } from '../utils/learning-path-utils';
  import { snackbar } from '$features/ui/snackbar/store';
  import { goto } from '$app/navigation';
  import { t } from '$lib/utils/functions/translations';

  let errorMessage = $state<string | null>(null);

  async function handleClone() {
    if ($clonePathModal.isSaving || !$clonePathModal.name.trim()) return;

    $clonePathModal.isSaving = true;
    errorMessage = null;

    try {
      const sourcePath =
        learningPathApi.paths.find((p) => p.id === $clonePathModal.id) ||
        (learningPathApi.currentPath?.id === $clonePathModal.id ? learningPathApi.currentPath : null);

      const newSlug = slugify($clonePathModal.name.trim()) + '-' + Date.now().toString().slice(-4);
      const newId = await learningPathApi.createPath({
        name: $clonePathModal.name.trim(),
        slug: newSlug,
        description: $clonePathModal.description.trim() || undefined
      });

      // If source path had courses, copy them over
      if (sourcePath && sourcePath.courses && sourcePath.courses.length > 0) {
        for (const courseItem of sourcePath.courses) {
          await learningPathApi.addCourse(newId, courseItem.courseId);
        }
      }

      snackbar.success('Learning path cloned successfully');
      clonePathModal.set({ ...clonePathModalInitialState });
      goto(`/paths/${newId}/courses`);
    } catch (err: unknown) {
      errorMessage = err instanceof Error ? err.message : 'Failed to clone learning path';
    } finally {
      $clonePathModal.isSaving = false;
    }
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      clonePathModal.set({ ...clonePathModalInitialState });
      errorMessage = null;
    }
  }
</script>

<Dialog.Root bind:open={$clonePathModal.open} onOpenChange={handleOpenChange}>
  <Dialog.Content class="w-96">
    <Dialog.Header>
      <Dialog.Title>{$t('learningPath.modals.clone.title') || 'Clone Learning Path'}</Dialog.Title>
    </Dialog.Header>
    <form onsubmit={preventDefault(handleClone)}>
      <InputField
        label={$t('learningPath.modals.create.name_label') || 'Path Name'}
        bind:value={$clonePathModal.name}
        autoFocus={true}
        placeholder={$t('learningPath.modals.create.name_placeholder') || 'e.g. Fullstack Web Development'}
        className="mb-4"
        isRequired={true}
        errorMessage={errorMessage ?? undefined}
      />

      <TextareaField
        label={$t('learningPath.modals.create.desc_label') || 'Description'}
        bind:value={$clonePathModal.description}
        placeholder={$t('learningPath.modals.create.desc_placeholder') || 'A brief summary...'}
        className="mb-4"
        rows={4}
      />

      <div class="mt-5 flex flex-row-reverse items-center gap-2">
        <Button type="submit" loading={$clonePathModal.isSaving} disabled={!$clonePathModal.name.trim()}>
          {$t('learningPath.modals.clone.submit') || $t('courses.copy_course.create_button') || 'Clone'}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={$clonePathModal.isSaving}
          onclick={() => clonePathModal.set({ ...clonePathModalInitialState })}
        >
          {$t('learningPath.modals.create.cancel') || 'Cancel'}
        </Button>
      </div>
    </form>
  </Dialog.Content>
</Dialog.Root>
