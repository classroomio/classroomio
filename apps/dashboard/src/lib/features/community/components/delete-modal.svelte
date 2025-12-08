<script lang="ts">
  import Modal from '$lib/components/Modal/index.svelte';
  import { Button } from '@cio/ui/base/button';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    onDelete?: any;
    onCancel?: any;
    open?: boolean;
    isQuestion?: boolean;
    isDeleting?: boolean;
  }

  let {
    onDelete = () => {},
    onCancel = () => {},
    open = $bindable(false),
    isQuestion = false,
    isDeleting = false
  }: Props = $props();
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
      <Button
        variant="outline"
        onclick={onCancel}
      >
        {$t('community.delete.no')}
      </Button>
      <Button
        onclick={onDelete}
        loading={isDeleting}
      >
        {$t('community.delete.yes')}
      </Button>
    </div>
  </div>
</Modal>
