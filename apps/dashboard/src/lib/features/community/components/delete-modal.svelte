<script lang="ts">
  import * as Dialog from '@cio/ui/base/dialog';
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

<Dialog.Root bind:open>
  <Dialog.Content class="w-96">
    <Dialog.Header>
      <Dialog.Title>
        {$t('community.delete.title')}
        {isQuestion ? $t('community.delete.question') : $t('community.delete.comment')}
      </Dialog.Title>
    </Dialog.Header>
    <div>
      <p class="mt-0 text-base dark:text-white">
        {$t('community.delete.sure')}
        {isQuestion ? $t('community.delete.question') : $t('community.delete.comment')}?
      </p>

      <div class="mt-5 flex items-center justify-between">
        <Button variant="outline" onclick={onCancel}>
          {$t('community.delete.no')}
        </Button>
        <Button onclick={onDelete} loading={isDeleting}>
          {$t('community.delete.yes')}
        </Button>
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>
