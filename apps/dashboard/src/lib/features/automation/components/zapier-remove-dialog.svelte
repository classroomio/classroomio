<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import * as Dialog from '@cio/ui/base/dialog';

  import type { ZapierConnection } from '$features/automation/utils/types';
  import { t } from '$lib/utils/functions/translations';

  const T = 'automation.zapier.remove';

  interface Props {
    connection: ZapierConnection | null;
    isRemoving: boolean;
    onConfirm: (connection: ZapierConnection) => void;
    onClose: () => void;
  }

  let { connection, isRemoving, onConfirm, onClose }: Props = $props();

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) onClose();
  }
</script>

<Dialog.Root open={connection !== null} onOpenChange={handleOpenChange}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>{$t(`${T}.title`)}</Dialog.Title>
      <Dialog.Description>
        {$t(`${T}.description`, { count: connection?.triggers.length ?? 0 })}
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer>
      <Button size="sm" variant="outline" onclick={onClose}>{$t('common.cancel')}</Button>
      <Button
        size="sm"
        variant="destructive"
        loading={isRemoving}
        onclick={() => connection && onConfirm(connection)}
        testId="zapier-remove-confirm"
      >
        {$t(`${T}.confirm`)}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
