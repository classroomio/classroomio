<script>
  import Modal from '$lib/components/Modal/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { t } from '$lib/utils/functions/translations';

  export let onDelete = () => {};
  export let onCancel = () => {};
  export let open = false;
  export let isQuestion = false;
  export let isDeleting = false;
</script>

<Modal
  onClose={() => (open = false)}
  bind:open
  width="w-96"
  modalHeading="{$t('community.delete.title')} {isQuestion
    ? $t('community.delete.question')
    : $t('community.delete.comment')}"
>
  <div>
    <p class="mt-0 text-base dark:text-white">
      {$t('community.delete.sure')}
      {isQuestion ? $t('community.delete.question') : $t('community.delete.comment')}?
    </p>

    <div class="mt-5 flex items-center justify-between">
      <PrimaryButton
        className="px-6 py-3"
        variant={VARIANTS.OUTLINED}
        label={$t('community.delete.no')}
        onClick={onCancel}
      />
      <PrimaryButton
        className="px-6 py-3"
        variant={VARIANTS.CONTAINED}
        label={$t('community.delete.yes')}
        onClick={onDelete}
        isLoading={isDeleting}
      />
    </div>
  </div>
</Modal>
