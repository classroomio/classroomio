<script lang="ts">
  import * as Dialog from '@cio/ui/base/dialog';
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

<Dialog.Root
  bind:open={openDeleteModal}
  onOpenChange={(isOpen) => {
    if (!isOpen) openDeleteModal = false;
  }}
>
  <Dialog.Content class="w-96 px-6 pt-2 pb-6">
    <Dialog.Header>
      <Dialog.Title>{$t('delete_modal.label')}</Dialog.Title>
    </Dialog.Header>
    <div>
      <h1 class="text-lg dark:text-white">
        {$t('delete_modal.content')}?
      </h1>

      <div class="mt-5 flex items-center justify-between">
        <Button variant="outline" onclick={() => (openDeleteModal = false)}>
          {$t('delete_modal.no')}
        </Button>
        <Button variant="outline" onclick={handleDelete}>
          {$t('delete_modal.yes')}
        </Button>
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>
