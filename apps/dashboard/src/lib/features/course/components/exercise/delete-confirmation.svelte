<script lang="ts">
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { t } from '$lib/utils/functions/translations';
  import { deleteConfirmation } from './store';

  let { onDelete = () => {}, onCancel = () => {} } = $props();
</script>

<Dialog.Root bind:open={$deleteConfirmation.open}>
  <Dialog.Content class="w-96">
    <Dialog.Header>
      <Dialog.Title>{$t('course.navItem.lessons.exercises.all_exercises.delete_confirmation.title')}</Dialog.Title>
    </Dialog.Header>
    <div>
      <p class="mt-0 text-base dark:text-white">
        {$t('course.navItem.lessons.exercises.all_exercises.delete_confirmation.sure')}
      </p>

      <div class="mt-5 flex items-center justify-between">
        <Button
          variant="outline"
          onclick={() => {
            $deleteConfirmation.open = false;
            onCancel();
          }}
        >
          {$t('course.navItem.lessons.exercises.all_exercises.delete_confirmation.no')}
        </Button>
        <Button
          onclick={() => {
            onDelete();
            $deleteConfirmation.open = false;
          }}
        >
          {$t('course.navItem.lessons.exercises.all_exercises.delete_confirmation.yes')}
        </Button>
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>
