<script lang="ts">
  import { t } from '$lib/utils/functions/translations';
  import { Button } from '@cio/ui/base/button';
  import * as Dialog from '@cio/ui/base/dialog';
  import { CopyInput } from '@cio/ui/custom/copy-input';
  import SquareArrowOutUpRightIcon from '@lucide/svelte/icons/square-arrow-out-up-right';

  interface Props {
    open: boolean;
    title: string;
    secret: string | null;
    docsHref: string;
  }

  let { open = $bindable(), title, secret, docsHref }: Props = $props();

  let copyButton = $state<HTMLButtonElement | null>(null);

  function focusCopyButton(event: Event) {
    event.preventDefault();
    copyButton?.focus();
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="sm:max-w-md" showCloseButton={false} onOpenAutoFocus={focusCopyButton}>
    <Dialog.Header>
      <Dialog.Title>{title}</Dialog.Title>
      <Dialog.Description>{$t('automation.keys.reveal.description')}</Dialog.Description>
    </Dialog.Header>

    <CopyInput
      value={secret ?? ''}
      bind:buttonRef={copyButton}
      copyLabel={$t('automation.keys.reveal.copy')}
      copiedLabel={$t('automation.keys.reveal.copied')}
      testId="automation-key-secret"
    />

    <Dialog.Footer class="items-center sm:justify-between">
      <Button variant="ghost" size="sm" href={docsHref} target="_blank" rel="noopener noreferrer">
        <SquareArrowOutUpRightIcon />
        {$t('automation.keys.reveal.how_to_use')}
      </Button>
      <Button variant="outline" size="sm" onclick={() => (open = false)}>
        {$t('automation.keys.reveal.close')}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
