<script>
  import Modal from '$lib/components/Modal/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';

  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { t } from '$lib/utils/functions/translations';
  import { deleteMemberModal } from './store';

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
  containerClass="pt-3"
  headerClass="py-2 px-5"
  modalHeading={$t('course.navItem.people.delete_confirmation.title')}
>
  <div>
    <p class="mt-0 text-base dark:text-white">
      {$t('course.navItem.people.delete_confirmation.sure')} <strong>{email}</strong>?
    </p>

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
