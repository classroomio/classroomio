<script>
  import Modal from '$lib/components/Modal/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';

  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { deleteConfirmation } from '../store/exercise';

  export let onDelete = () => {};
  export let onCancel = () => {};

  async function handleDelete() {
    onDelete();
    $deleteConfirmation.open = false;
  }
</script>

<Modal
  onClose={() => ($deleteConfirmation.open = false)}
  bind:open={$deleteConfirmation.open}
  width="w-96"
  modalHeading="Delete question"
>
  <div>
    <h1 class="dark:text-white text-lg">
      Are you sure you want to delete this question?
    </h1>

    <div class="mt-5 flex items-center justify-between">
      <PrimaryButton
        className="px-6 py-3"
        variant={VARIANTS.OUTLINED}
        label="No, please don't"
        onClick={() => {
          $deleteConfirmation.open = false;
          onCancel();
        }}
      />
      <PrimaryButton
        className="px-6 py-3"
        variant={VARIANTS.CONTAINED_DANGER}
        label="Yes, delete"
        onClick={() => {
          onDelete();
          $deleteConfirmation.open = false;
        }}
      />
    </div>
  </div>
</Modal>
