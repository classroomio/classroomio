<script lang="ts">
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    open: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    destructive?: boolean;
    onConfirm: () => Promise<void> | void;
  }

  let { open = $bindable(false), title, description, confirmLabel, destructive = false, onConfirm }: Props = $props();

  let isWorking = $state(false);

  async function handleConfirm() {
    isWorking = true;

    try {
      await onConfirm();
      open = false;
    } finally {
      isWorking = false;
    }
  }
</script>

<Dialog.Root
  {open}
  onOpenChange={(isOpen) => {
    if (!isWorking) open = isOpen;
  }}
>
  <Dialog.Content class="max-w-md">
    <Dialog.Header>
      <Dialog.Title>{title}</Dialog.Title>
      <Dialog.Description>{description}</Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer>
      <Button size="sm" variant="outline" onclick={() => (open = false)} disabled={isWorking}>
        {$t('app.cancel')}
      </Button>
      <Button size="sm" variant={destructive ? 'destructive' : 'default'} onclick={handleConfirm} loading={isWorking}>
        {confirmLabel}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
