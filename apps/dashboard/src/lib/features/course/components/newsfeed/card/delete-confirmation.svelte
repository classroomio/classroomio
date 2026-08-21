<script lang="ts">
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    openDeleteModal?: boolean;
    deleteFeed?: any;
  }

  let { openDeleteModal = $bindable(false), deleteFeed = () => {} }: Props = $props();

  async function handleDelete() {
    deleteFeed();
    openDeleteModal = false;
  }
</script>

<Dialog.Root bind:open={openDeleteModal}>
  <Dialog.Content class="w-96">
    <Dialog.Header>
      <Dialog.Title>{$t('course.navItem.news_feed.delete_modal.title')}</Dialog.Title>
    </Dialog.Header>
    <div>
      <h1 class="text-lg dark:text-white">{$t('course.navItem.news_feed.delete_modal.description')}</h1>

      <div class="mt-5 flex items-center justify-between">
        <Button variant="outline" onclick={() => (openDeleteModal = false)}
          >{$t('course.navItem.news_feed.delete_modal.no')}</Button
        >
        <Button variant="outline" onclick={handleDelete}>{$t('course.navItem.news_feed.delete_modal.yes')}</Button>
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>
