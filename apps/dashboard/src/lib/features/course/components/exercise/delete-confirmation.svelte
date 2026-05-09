<script lang="ts">
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { t } from '$lib/utils/functions/translations';
  import { deleteConfirmation } from './store';

  let {
    title = $t('course.navItem.lessons.exercises.all_exercises.delete_confirmation.title'),
    description = $t('course.navItem.lessons.exercises.all_exercises.delete_confirmation.sure'),
    cancelLabel = $t('course.navItem.lessons.exercises.all_exercises.delete_confirmation.no'),
    confirmLabel = $t('course.navItem.lessons.exercises.all_exercises.delete_confirmation.yes'),
    onDelete = () => {},
    onCancel = () => {}
  } = $props();
</script>

<Dialog.Root bind:open={$deleteConfirmation.open}>
  <Dialog.Content class="w-96">
    <Dialog.Header>
      <Dialog.Title>{title}</Dialog.Title>
    </Dialog.Header>
    <div>
      <p class="mt-0 text-base dark:text-white">{description}</p>

      <div class="mt-5 flex items-center justify-between">
        <Button
          variant="outline"
          onclick={() => {
            $deleteConfirmation.open = false;
            onCancel();
          }}
        >
          {cancelLabel}
        </Button>
        <Button
          onclick={() => {
            onDelete();
            $deleteConfirmation.open = false;
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>
