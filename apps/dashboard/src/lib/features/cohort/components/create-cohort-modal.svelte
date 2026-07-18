<script lang="ts">
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { Input } from '@cio/ui/base/input';
  import { Textarea } from '@cio/ui/base/textarea';
  import { Label } from '@cio/ui/base/label';
  import { t } from '$lib/utils/functions/translations';
  import { cohortApi } from '../api';

  interface Props {
    open: boolean;
  }

  let { open = $bindable(false) }: Props = $props();

  let name = $state('');
  let description = $state('');

  async function handleCreate() {
    if (!name.trim()) return;
    await cohortApi.createCohort({ name: name.trim(), description: description.trim() || undefined });
    name = '';
    description = '';
    open = false;
  }

  function handleCancel() {
    name = '';
    description = '';
    open = false;
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="max-w-md">
    <Dialog.Header>
      <Dialog.Title>{$t('cohorts.create_modal.title') || 'Create Cohort'}</Dialog.Title>
      <Dialog.Description>
        {$t('cohorts.create_modal.description') || 'Add a new certification or compliance cohort.'}
      </Dialog.Description>
    </Dialog.Header>

    <div class="flex flex-col gap-4 py-2">
      <div class="flex flex-col gap-1.5">
        <Label for="cohort-name">{$t('cohorts.create_modal.name_label') || 'Name'} *</Label>
        <Input
          id="cohort-name"
          bind:value={name}
          placeholder={$t('cohorts.create_modal.name_placeholder') || 'e.g. OSHA Safety Certification'}
          maxlength={255}
        />
      </div>

      <div class="flex flex-col gap-1.5">
        <Label for="cohort-description">{$t('cohorts.create_modal.description_label') || 'Description'}</Label>
        <Textarea
          id="cohort-description"
          bind:value={description}
          placeholder={$t('cohorts.create_modal.description_placeholder') || 'What is this cohort about?'}
          rows={3}
          maxlength={2000}
        />
      </div>
    </div>

    <Dialog.Footer>
      <Button variant="outline" onclick={handleCancel}>{$t('app.cancel') || 'Cancel'}</Button>
      <Button onclick={handleCreate} disabled={!name.trim() || cohortApi.isLoading}>
        {$t('cohorts.create_modal.submit') || 'Create'}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
