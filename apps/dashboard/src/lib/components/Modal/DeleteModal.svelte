<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { t } from '$lib/utils/functions/translations';
  import Modal from './index.svelte';

  interface Props {
    open?: boolean;
    onDelete?: () => void;
    isLoading?: boolean;
  }

  let { open = $bindable(false), onDelete = () => {}, isLoading = false }: Props = $props();
</script>

<Modal
  onClose={() => !isLoading && (open = false)}
  bind:open
  width="w-96"
  containerClass="p-6"
  headerClass="p-2"
  modalHeading={$t('delete_modal.label')}
>
  <div>
    <p class="text-center text-xl dark:text-white">
      {$t('delete_modal.content')}
    </p>

    <div class="mt-8 flex items-center justify-between">
      <Button
        variant="outline"
        onclick={() => (open = false)}
        disabled={isLoading}
      >
        {$t('delete_modal.no')}
      </Button>
      <Button
        variant="destructive"
        onclick={onDelete}
        loading={isLoading}
      >
        {$t('delete_modal.yes')}
      </Button>
    </div>
  </div>
</Modal>
