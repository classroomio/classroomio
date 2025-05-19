<script>
  import Modal from '$lib/components/Modal/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { t } from '$lib/utils/functions/translations';

  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { deleteConfirmation } from '../store/exercise';

  export let onDelete = () => {};
  export let onCancel = () => {};
</script>

<Modal
  onClose={() => ($deleteConfirmation.open = false)}
  bind:open={$deleteConfirmation.open}
  width="w-96"
  modalHeading={$t('course.navItem.lessons.exercises.all_exercises.delete_confirmation.title')}
>
  <div>
    <p class="mt-0 text-base dark:text-white">
      {$t('course.navItem.lessons.exercises.all_exercises.delete_confirmation.sure')}
    </p>

    <div class="mt-5 flex items-center justify-between">
      <PrimaryButton
        className="px-6 py-3"
        variant={VARIANTS.OUTLINED}
        label={$t('course.navItem.lessons.exercises.all_exercises.delete_confirmation.no')}
        onClick={() => {
          $deleteConfirmation.open = false;
          onCancel();
        }}
      />
      <PrimaryButton
        className="px-6 py-3"
        variant={VARIANTS.CONTAINED}
        label={$t('course.navItem.lessons.exercises.all_exercises.delete_confirmation.yes')}
        onClick={() => {
          onDelete();
          $deleteConfirmation.open = false;
        }}
      />
    </div>
  </div>
</Modal>
