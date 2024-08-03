<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  import Modal from '$lib/components/Modal/index.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import RadioItem from '$lib/components/Form/RadioItem.svelte';
  import Date from '$lib/components/Form/Date.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';

  import { t } from '$lib/utils/functions/translations';

  let createBatchParam;
  let makeBatchActive: boolean = true;

  function closeModal() {
    goto($page.url.pathname);
  }

  $: {
    const query = new URLSearchParams($page.url.search);
    createBatchParam = query.get('create-batch');
  }
</script>

<Modal
  onClose={() => closeModal()}
  open={createBatchParam === 'true'}
  width="w-4/5 md:w-2/5"
  maxWidth="max-w-lg"
  modalHeading={$t('course.navItem.people.batches.create.title')}
>
  <form class="space-y-6">
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

    <div class="flex justify-between border p-4 rounded-md">
      <p class="inline-flex">
        {$t('course.navItem.people.batches.create.make_batch_active')}
      </p>
      <div class="flex gap-x-6 pr-4">
        <RadioItem
          className="w-6 inline-flex"
          value="yes"
          name="make_batch_active"
          checked={makeBatchActive}
          label={$t('course.navItem.people.batches.create.yes')}
        />
        <RadioItem
          className="w-6"
          value="no"
          name="make_batch_active"
          label={$t('course.navItem.people.batches.create.no')}
        />
      </div>
    </div>

    <div class="flex justify-end">
      <PrimaryButton className="!w-44 !p-4"
        >{$t('course.navItem.people.batches.create.create')}</PrimaryButton
      >
    </div>
  </form>
</Modal>
