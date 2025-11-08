<script lang="ts">
  import Modal from '$lib/components/Modal/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    openDeleteModal?: boolean;
    deleteLesson?: any;
  }

  let { openDeleteModal = $bindable(false), deleteLesson = () => {} }: Props = $props();

  async function handleDelete() {
    deleteLesson();
    openDeleteModal = false;
  }
</script>

<Modal
  onClose={() => (openDeleteModal = false)}
  bind:open={openDeleteModal}
  width="w-96"
  containerClass="px-6 pt-2 pb-6"
  modalHeading={$t('delete_modal.label')}
>
  <div>
    <h1 class="text-lg dark:text-white">
      {$t('delete_modal.content')}?
    </h1>

    <div class="mt-5 flex items-center justify-between">
      <PrimaryButton
        className="px-6 py-3"
        variant={VARIANTS.OUTLINED}
        label={$t('delete_modal.no')}
        onClick={() => (openDeleteModal = false)}
      />
      <PrimaryButton
        className="px-6 py-3"
        variant={VARIANTS.OUTLINED}
        label={$t('delete_modal.yes')}
        onClick={handleDelete}
      />
    </div>
  </div>
</Modal>
