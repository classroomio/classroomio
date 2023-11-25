<script>
  import Modal from '$lib/components/Modal/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';

  export let onDelete = () => {};
  export let onCancel = () => {};
  export let open = false;
</script>

<Modal onClose={() => (open = false)} bind:open width="w-96" modalHeading="Delete comment">
  <div>
    <h1 class="dark:text-white text-lg">Are you sure you want to delete this comment?</h1>

    <div class="mt-5 flex items-center justify-between">
      <PrimaryButton
        className="px-6 py-3"
        variant={VARIANTS.OUTLINED}
        label="No, keep it"
        onClick={onCancel}
      />
      <PrimaryButton
        className="px-6 py-3"
        variant={VARIANTS.CONTAINED}
        label="Yes, delete"
        onClick={onDelete}
      />
    </div>
  </div>
</Modal>
