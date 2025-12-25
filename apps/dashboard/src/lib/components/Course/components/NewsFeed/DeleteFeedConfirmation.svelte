<script lang="ts">
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';

  interface Props {
    openDeleteModal?: boolean;
    deleteFeed?: any;
  }

  let { openDeleteModal = $bindable(false), deleteFeed = () => {} }: Props = $props();

  async function handleDelete() {
    deleteFeed();
    openDeleteModal = false;
  }
</script>

<Dialog.Root bind:open={openDeleteModal}>
  <Dialog.Content class="w-96">
    <Dialog.Header>
      <Dialog.Title>Delete Feed</Dialog.Title>
    </Dialog.Header>
    <div>
      <h1 class="text-lg dark:text-white">Are you sure you want to delete this feed?</h1>

      <div class="mt-5 flex items-center justify-between">
        <Button variant="outline" onclick={() => (openDeleteModal = false)}>No</Button>
        <Button variant="outline" onclick={handleDelete}>Yes</Button>
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>
