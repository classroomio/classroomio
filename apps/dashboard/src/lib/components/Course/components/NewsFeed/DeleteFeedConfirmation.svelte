<script lang="ts">
  import Modal from '$lib/components/Modal/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';

  import { VARIANTS } from '$lib/components/PrimaryButton/constants';

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
      <PrimaryButton
        className="px-6 py-3"
        variant={VARIANTS.OUTLINED}
        label="No"
        onClick={() => (openDeleteModal = false)}
      />
      <PrimaryButton className="px-6 py-3" variant={VARIANTS.OUTLINED} label="Yes" onClick={handleDelete} />
    </div>
  </div>
</Modal>
