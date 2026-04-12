<script lang="ts">
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    openDeleteModal?: boolean;
    deleteFeed?: () => void;
  }

  let { openDeleteModal = $bindable(false), deleteFeed = () => {} }: Props = $props();

  const handleDelete = async () => {
    deleteFeed();
    openDeleteModal = false;
  };
</script>

<Dialog.Root bind:open={openDeleteModal}>
  <Dialog.Content class="w-96">
    <Dialog.Header>
      <Dialog.Title>{$t('programs.newsfeed.delete_feed_title')}</Dialog.Title>
    </Dialog.Header>
    <div>
      <p class="text-lg">{$t('programs.newsfeed.delete_feed_description')}</p>

      <div class="mt-5 flex items-center justify-between">
        <Button variant="outline" onclick={() => (openDeleteModal = false)}>
          {$t('programs.newsfeed.cancel')}
        </Button>
        <Button variant="outline" onclick={handleDelete}>
          {$t('programs.newsfeed.confirm_delete')}
        </Button>
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>
