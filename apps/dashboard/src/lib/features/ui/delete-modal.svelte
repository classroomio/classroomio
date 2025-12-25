<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { t } from '$lib/utils/functions/translations';
  import * as Dialog from '@cio/ui/base/dialog';

  interface Props {
    open?: boolean;
    onDelete?: () => void;
    isLoading?: boolean;
  }

  let { open = $bindable(false), onDelete = () => {}, isLoading = false }: Props = $props();
</script>

<Dialog.Root
  bind:open
  onOpenChange={(isOpen) => {
    if (!isOpen && !isLoading) open = false;
  }}
>
  <Dialog.Content class="w-96 p-6">
    <Dialog.Header class="p-2">
      <Dialog.Title>{$t('delete_modal.label')}</Dialog.Title>
    </Dialog.Header>
    <div>
      <p class="text-center text-xl dark:text-white">
        {$t('delete_modal.content')}
      </p>

      <div class="mt-8 flex items-center justify-between">
        <Button variant="outline" onclick={() => (open = false)} disabled={isLoading}>
          {$t('delete_modal.no')}
        </Button>
        <Button variant="destructive" onclick={onDelete} loading={isLoading}>
          {$t('delete_modal.yes')}
        </Button>
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>
