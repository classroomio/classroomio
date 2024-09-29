<script lang="ts">
  import { Toggle } from 'carbon-components-svelte';
  import TrashCan from 'carbon-icons-svelte/lib/TrashCan.svelte';

  import { goto } from '$app/navigation';
  import { courseBatch } from '../../store';
  import { batchSettingsModal } from './store';
  import type { Batch } from '$lib/utils/types';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$lib/components/Snackbar/store';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { deleteCourseBatch, editCourseBatch } from '$lib/utils/services/courses';

  import Modal from '$lib/components/Modal/index.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';

  export let data: Batch = {};
  export let courseId: any;

  let onDelete: boolean = false;

  // to track the initial state
  let initialData = { ...data };

  // current states for inputs
  let name = data.name;
  let is_active = data.is_active || false;

  function closeModal() {
    $batchSettingsModal.open = false;
  }

  const deleteBatch = async () => {
    const response = await deleteCourseBatch(data.id);

    if (response.status === 204) {
      snackbar.success('Delete Successful');
      closeModal();

      goto(`/courses/${courseId}/people`);
    }
  };

  const onSubmit = async () => {
    let updatedFields: Partial<Pick<Batch, 'name' | 'is_active'>> = {};

    if (name !== initialData.name) updatedFields.name = name;
    if (is_active !== initialData.is_active) updatedFields.is_active = is_active;

    if (Object.keys(updatedFields).length > 0) {
      try {
        const response = await editCourseBatch(data.id, updatedFields);

        if (response && response.length > 0) {
          const updatedBatch = response[0];

          courseBatch.update((batches) => {
            return batches.map((batch) => {
              if (batch.id === updatedBatch.id) {
                return {
                  ...batch,
                  name: updatedBatch.name,
                  is_active: updatedBatch.is_active
                };
              }
              return batch;
            });
          });

          snackbar.success('Update Successful');
          closeModal();
        }
      } catch (error) {
        snackbar.error('Failed to edit batch');
        console.error('Failed to edit batch:', error);
      }
    } else {
      snackbar.info('No changes detected');
      console.log('No changes detected');
    }
  };
</script>

<Modal
  onClose={() => closeModal()}
  open={$batchSettingsModal.open}
  width="w-4/5 md:w-2/5"
  maxWidth="max-w-xl"
  modalHeading={$t('course.navItem.people.batches.settings.title')}
>
  {#if onDelete}
    <div class="flex flex-col justify-center items-center gap-8">
      <h3 class="font-medium text-center">
        Are you sure you want to delete this batch? This action will be irreversible
      </h3>
      <PrimaryButton
        onClick={() => deleteBatch()}
        className="!w-44 !p-4"
        type="submit"
        variant={VARIANTS.CONTAINED_DANGER}
      >
        {$t('course.navItem.people.batches.settings.delete')}</PrimaryButton
      >
    </div>
  {:else}
    <form class="space-y-10" on:submit|preventDefault={onSubmit}>
      <TextField
        label={$t('course.navItem.people.batches.create.batch_name')}
        autoFocus={true}
        placeholder="Cohort 1"
        className="mb-4"
        isRequired={true}
        autoComplete={false}
        bind:value={name}
      />

      <!-- <div class="flex w-full justify-between gap-x-8">
      <Date className="w-60" label={$t('course.navItem.people.batches.create.start_date')} />
      <Date className="w-60" label={$t('course.navItem.people.batches.create.end_date')} />
    </div> -->

      <div class="flex w-full justify-between">
        <!-- Status toggle button -->
        <div
          class="w-52 border border-[#EAEAEA] flex items-end justify-between text-lg gap-x-1 p-2 px-4 rounded"
        >
          <p class="dark:text-white mr-2 mb-2">
            {$t('course.navItem.people.batches.settings.status')}
          </p>

          <Toggle bind:toggled={is_active} class="mb-2">
            <span slot="labelA" style="color: gray"
              >{$t('course.navItem.people.batches.settings.status_inactive')}</span
            >
            <span slot="labelB" style="color: gray"
              >{$t('course.navItem.people.batches.settings.status_active')}</span
            >
          </Toggle>
        </div>

        <PrimaryButton
          onClick={() => (onDelete = true)}
          className="!w-44 flex gap-3 items-center"
          type="submit"
          variant={VARIANTS.TEXT_DANGER}
        >
          <TrashCan size={24} />
          {$t('course.navItem.people.batches.settings.delete')}
        </PrimaryButton>
      </div>

      <div class="flex justify-end">
        <PrimaryButton className="!w-44 !p-4" type="submit"
          >{$t('course.navItem.people.batches.settings.save_changes')}</PrimaryButton
        >
      </div>
    </form>
  {/if}
</Modal>
