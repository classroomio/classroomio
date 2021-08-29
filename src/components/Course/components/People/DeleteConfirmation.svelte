<script>
  import Modal from '../../../Modal/index.svelte';
  import PrimaryButton from '../../../PrimaryButton/index.svelte';

  import { VARIANTS } from '../../../PrimaryButton/constants';
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
  modalHeading="Delete"
>
  <div>
    <h1 class="text-lg">
      Are you sure you want to delete <strong>{email}</strong>?
    </h1>

    <div class="mt-5 flex items-center justify-between">
      <PrimaryButton
        className="px-6 py-2"
        variant={VARIANTS.OUTLINED}
        label="No"
        onClick={() => ($deleteMemberModal.open = false)}
      />
      <PrimaryButton
        className="px-6 py-2"
        variant={VARIANTS.OUTLINED}
        label="Yes"
        onClick={handleDelete}
      />
    </div>
  </div>
</Modal>
