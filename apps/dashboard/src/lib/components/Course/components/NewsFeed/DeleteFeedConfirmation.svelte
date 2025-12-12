<script lang="ts">
  import Modal from '$lib/components/Modal/index.svelte';
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

<Modal onClose={() => (openDeleteModal = false)} bind:open={openDeleteModal} width="w-96" modalHeading="Delete Feed">
  <div>
    <h1 class="text-lg dark:text-white">Are you sure you want to delete this feed?</h1>

    <div class="mt-5 flex items-center justify-between">
      <Button
        variant="outline"
        onclick={() => (openDeleteModal = false)}
      >
        No
      </Button>
      <Button variant="outline" onclick={handleDelete}>
        Yes
      </Button>
    </div>
  </div>
</Modal>
