<script lang="ts">
  import { courseBatch } from '../../store.js';
  import type { Batch } from '$lib/utils/types';
  import { createBatchModal } from './store.js';
  import { currentOrg } from '$lib/utils/store/org.js';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$lib/components/Snackbar/store.js';
  import { createCourseBatch } from '$lib/utils/services/courses';

  import Modal from '$lib/components/Modal/index.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import RadioItem from '$lib/components/Form/RadioItem.svelte';
  // import Date from '$lib/components/Form/Date.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';

  export let orgId;
  export let getCourseBatch;

  let batch: Batch = {
    name: '',
    is_active: false,
    organization_id: orgId
  };

  function closeModal() {
    $createBatchModal.open = false;

    // calling again to update the batch list
    getCourseBatch();
  }

  function handleRadioClick(value: string) {
    batch.is_active = value === 'yes';
  }

  const handleSave = async () => {
    try {
      const newBatch = await createCourseBatch(batch);

      courseBatch.update((existingBatches) => {
        return [...existingBatches, newBatch[0]];
      });

      snackbar.success('Batch successfully created');

      closeModal();
    } catch (error) {
      console.log('error', error);
      snackbar.error('Creating batche');
    }
  };
</script>

<Modal
  onClose={() => closeModal()}
  bind:open={$createBatchModal.open}
  width="w-4/5 md:w-2/5"
  maxWidth="max-w-lg"
  modalHeading={$t('course.navItem.people.batches.create.title')}
>
  <form class="space-y-6" on:submit|preventDefault={handleSave}>
    <TextField
      label={$t('course.navItem.people.batches.create.batch_name')}
      autoFocus={true}
      placeholder="Cohort 1"
      className="mb-4"
      isRequired={true}
      autoComplete={false}
      bind:value={batch.name}
    />

    <!-- <div class="flex w-full justify-between gap-x-8">
      <Date className="w-60" label={$t('course.navItem.people.batches.create.start_date')} />
      <Date className="w-60" label={$t('course.navItem.people.batches.create.end_date')} />
    </div> -->

    <div class="flex justify-between border p-4 rounded-md">
      <p class="inline-flex">
        {$t('course.navItem.people.batches.create.make_batch_active')}
      </p>
      <div class="flex gap-x-6 pr-4">
        <RadioItem
          className="w-6 inline-flex"
          value="yes"
          name="make_batch_active"
          checked={batch.is_active === true}
          onInputChange={() => handleRadioClick('yes')}
          label={$t('course.navItem.people.batches.create.yes')}
        />

        <RadioItem
          className="w-6"
          value="no"
          name="make_batch_active"
          checked={batch.is_active === false}
          onInputChange={() => handleRadioClick('no')}
          label={$t('course.navItem.people.batches.create.no')}
        />
      </div>
    </div>

    <div class="flex justify-end">
      <PrimaryButton className="!w-44 !p-4" type="submit"
        >{$t('course.navItem.people.batches.create.create')}</PrimaryButton
      >
    </div>
  </form>
</Modal>
