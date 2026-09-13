<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import * as Dialog from '@cio/ui/base/dialog';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    open?: boolean;
    onGoToDeadline: () => void;
  }

  let { open = $bindable(false), onGoToDeadline }: Props = $props();
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="max-w-md" onCloseAutoFocus={(e) => e.preventDefault()}>
    <Dialog.Header>
      <Dialog.Title>{$t('course.navItem.settings.certificate_deadline_required')}</Dialog.Title>
      <Dialog.Description>
        {$t('course.navItem.settings.certificate_deadline_required_description')}
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer>
      <Button variant="outline" onclick={() => (open = false)}>
        {$t('cancel')}
      </Button>
      <Button onclick={onGoToDeadline}>
        {$t('course.navItem.settings.go_to_completion_deadline')}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
