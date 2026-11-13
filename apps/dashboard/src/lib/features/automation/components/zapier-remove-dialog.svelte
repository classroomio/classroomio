<script lang="ts">
  import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
  import { Button } from '@cio/ui/base/button';
  import * as Dialog from '@cio/ui/base/dialog';

  import type { ZapierConnection } from '$features/automation/utils/types';
  import { ZAPIER_URLS } from '$features/automation/utils/zapier-utils';
  import { t } from '$lib/utils/functions/translations';

  const T = 'automation.zapier.remove';

  interface Props {
    connection: ZapierConnection | null;
    isRemoving: boolean;
    onConfirm: (connection: ZapierConnection) => void;
    onClose: () => void;
  }

  let { connection, isRemoving, onConfirm, onClose }: Props = $props();

  let activeTriggerCount = $derived(connection?.triggers.filter((trigger) => trigger.isActive).length ?? 0);

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) onClose();
  }
</script>

<Dialog.Root open={connection !== null} onOpenChange={handleOpenChange}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>{$t(`${T}.title`)}</Dialog.Title>
      <Dialog.Description>
        {$t(`${T}.description`, { count: activeTriggerCount })}
      </Dialog.Description>
      <p class="ui:text-muted-foreground text-sm">
        {$t(`${T}.zapier_side`)}
        <!-- eslint-disable svelte/no-navigation-without-resolve -- links to the absolute Zapier connections URL, not an internal route. -->
        <a
          href={ZAPIER_URLS.connections}
          target="_blank"
          rel="noopener noreferrer"
          class="ui:text-primary inline-flex items-center gap-0.5 font-medium hover:underline"
          data-testid="zapier-remove-open-connections"
        >
          {$t(`${T}.open_zapier_connections`)}
          <ArrowUpRightIcon size={14} />
        </a>
        <!-- eslint-enable svelte/no-navigation-without-resolve -->
      </p>
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
