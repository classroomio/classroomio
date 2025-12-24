<script lang="ts">
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { t } from '$lib/utils/functions/translations';
  import { deleteMemberModal } from './store';

  let { email, deletePerson = () => {} } = $props();

  async function handleDelete() {
    deletePerson();
    $deleteMemberModal.open = false;
  }
</script>

<Dialog.Root
  bind:open={$deleteMemberModal.open}
>
  <Dialog.Content class="w-96 pt-3">
    <Dialog.Header class="py-2 px-5">
      <Dialog.Title>{$t('course.navItem.people.delete_confirmation.title')}</Dialog.Title>
    </Dialog.Header>
    <div>
    <p class="mt-0 text-base dark:text-white">
      {$t('course.navItem.people.delete_confirmation.sure')} <strong>{email}</strong>?
    </p>

    <div class="mt-5 flex items-center justify-between">
      <Button
        variant="outline"
        onclick={() => ($deleteMemberModal.open = false)}
      >
        {$t('course.navItem.people.delete_confirmation.no')}
      </Button>
      <Button
        variant="outline"
        onclick={handleDelete}
      >
        {$t('course.navItem.people.delete_confirmation.yes')}
      </Button>
    </div>
  </div>
  </Dialog.Content>
</Dialog.Root>
