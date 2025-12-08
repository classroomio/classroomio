<script lang="ts">
  import Modal from '$lib/components/Modal/index.svelte';
  import { Button } from '@cio/ui/base/button';
  import { t } from '$lib/utils/functions/translations';
  import { deleteMemberModal } from './store';

  let { email, deletePerson = () => {} } = $props();

  async function handleDelete() {
    deletePerson();
    $deleteMemberModal.open = false;
  }
</script>

<Modal
  onClose={() => ($deleteMemberModal.open = false)}
  bind:open={$deleteMemberModal.open}
  width="w-96"
  containerClass="pt-3"
  headerClass="py-2 px-5"
  modalHeading={$t('course.navItem.people.delete_confirmation.title')}
>
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
</Modal>
