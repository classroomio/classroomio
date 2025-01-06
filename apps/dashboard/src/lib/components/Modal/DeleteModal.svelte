<script lang="ts">
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { t } from '$lib/utils/functions/translations';
  import Modal from './index.svelte';

  export let open = false;
  export let onDelete = () => {};

  function handleDelete() {
    onDelete();
    open = false;
  }
</script>

<Modal
  onClose={() => (open = false)}
  bind:open
  width="w-96"
  containerClass="p-6"
  headerClass="p-2"
  modalHeading={$t('delete_modal.label')}
>
  <div>
    <p class="text-center text-xl dark:text-white">
      {$t('delete_modal.content')}
    </p>

    <div class="mt-8 flex items-center justify-between">
      <PrimaryButton
        className="px-6 py-3"
        variant={VARIANTS.OUTLINED}
        label={$t('delete_modal.no')}
        onClick={() => (open = false)}
      />
      <PrimaryButton
        className="px-6 py-3"
        variant={VARIANTS.CONTAINED_DANGER}
        label={$t('delete_modal.yes')}
        onClick={handleDelete}
      />
    </div>
  </div>
</Modal>
