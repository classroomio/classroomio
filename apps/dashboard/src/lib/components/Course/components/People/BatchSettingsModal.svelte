<script lang="ts">
  import { Toggle } from 'carbon-components-svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  import TrashCan from 'carbon-icons-svelte/lib/TrashCan.svelte';
  import Modal from '$lib/components/Modal/index.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import Date from '$lib/components/Form/Date.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';

  import { t } from '$lib/utils/functions/translations';
  import { writable } from 'svelte/store';

  let createBatchParam;

  const settings = writable({
    isBatchActive: false
  });

  function closeModal() {
    goto($page.url.pathname);
  }

  $: {
    const query = new URLSearchParams($page.url.search);
    createBatchParam = query.get('batch-settings');
  }
</script>

<Modal
  onClose={() => closeModal()}
  open={createBatchParam === 'true'}
  width="w-4/5 md:w-2/5"
  maxWidth="max-w-xl"
  modalHeading={$t('course.navItem.people.batches.settings.title')}
>
  <form class="space-y-10">
    <TextField
      label={$t('course.navItem.people.batches.create.batch_name')}
      autoFocus={true}
      placeholder="Cohort 1"
      className="mb-4"
      isRequired={true}
      autoComplete={false}
    />

    <div class="flex w-full justify-between gap-x-8">
      <Date className="w-60" label={$t('course.navItem.people.batches.create.start_date')} />
      <Date className="w-60" label={$t('course.navItem.people.batches.create.end_date')} />
    </div>

    <div class="flex w-full justify-between">
      <!-- Status toggle button -->
      <div
        class="w-52 border border-[#EAEAEA] flex items-end justify-between text-lg gap-x-1 p-2 px-4 rounded"
      >
        <p class="dark:text-white mr-2 mb-2">
          {$t('course.navItem.people.batches.settings.status')}
        </p>

        <Toggle bind:toggled={$settings.isBatchActive} class="mb-2">
          <span slot="labelA" style="color: gray"
            >{$t('course.navItem.people.batches.settings.status_inactive')}</span
          >
          <span slot="labelB" style="color: gray"
            >{$t('course.navItem.people.batches.settings.status_active')}</span
          >
        </Toggle>
      </div>

      <!-- Delete Button -->
      <button
        class="w-52 border border-[#EAEAEA] flex items-center text-lg text-[#E30429] gap-x-1 p-1 px-4 hover:underline rounded"
      >
        <TrashCan size={24} />
        {$t('course.navItem.people.batches.settings.delete')}
      </button>
    </div>

    <div class="flex justify-end">
      <PrimaryButton className="!w-44 !p-4"
        >{$t('course.navItem.people.batches.settings.save_changes')}</PrimaryButton
      >
    </div>
  </form>
</Modal>
