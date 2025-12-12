<script lang="ts">
  import Modal from '$lib/components/Modal/index.svelte';
  import { Button } from '@cio/ui/base/button';
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
      <Button
        variant="outline"
        onclick={() => (openDeleteModal = false)}
      >
        {$t('delete_modal.no')}
      </Button>
      <Button
        variant="outline"
        onclick={handleDelete}
      >
        {$t('delete_modal.yes')}
      </Button>
    </div>
  </div>
</Modal>
