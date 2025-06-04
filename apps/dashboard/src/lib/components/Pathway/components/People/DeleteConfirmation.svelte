<script>
  import Modal from '$lib/components/Modal/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';

  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { deleteMemberModal } from './store';
  import { t } from '$lib/utils/functions/translations';

  export let email;
  export let deletePerson = () => {};

  async function handleDelete() {
    deletePerson();
    $deleteMemberModal.open = false;
  }
</script>

<Modal
  onClose={() => ($deleteMemberModal.open = false)}
  bind:open={$deleteMemberModal.open}
  width="w-96"
  modalHeading={$t('course.navItem.people.delete_confirmation.title')}
>
  <div>
    <h1 class="dark:text-white text-lg">
      {$t('course.navItem.people.delete_confirmation.sure')} <strong>{email}</strong>?
    </h1>

    <div class="mt-5 flex items-center justify-between">
      <PrimaryButton
        className="px-6 py-3"
        variant={VARIANTS.OUTLINED}
        label={$t('course.navItem.people.delete_confirmation.no')}
        onClick={() => ($deleteMemberModal.open = false)}
      />
      <PrimaryButton
        className="px-6 py-3"
        variant={VARIANTS.OUTLINED}
        label={$t('course.navItem.people.delete_confirmation.yes')}
        onClick={handleDelete}
      />
    </div>
  </div>
</Modal>
