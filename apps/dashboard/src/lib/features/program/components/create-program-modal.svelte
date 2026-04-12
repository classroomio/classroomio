<script lang="ts">
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { Input } from '@cio/ui/base/input';
  import { Textarea } from '@cio/ui/base/textarea';
  import { Label } from '@cio/ui/base/label';
  import { t } from '$lib/utils/functions/translations';
  import { programApi } from '../api';

  interface Props {
    open: boolean;
  }

  let { open = $bindable(false) }: Props = $props();

  let name = $state('');
  let description = $state('');

  async function handleCreate() {
    if (!name.trim()) return;
    await programApi.createProgram({ name: name.trim(), description: description.trim() || undefined });
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
      <Dialog.Title>{$t('programs.create_modal.title') || 'Create Program'}</Dialog.Title>
      <Dialog.Description>
        {$t('programs.create_modal.description') || 'Add a new certification or compliance program.'}
      </Dialog.Description>
    </Dialog.Header>

    <div class="flex flex-col gap-4 py-2">
      <div class="flex flex-col gap-1.5">
        <Label for="program-name">{$t('programs.create_modal.name_label') || 'Name'} *</Label>
        <Input
          id="program-name"
          bind:value={name}
          placeholder={$t('programs.create_modal.name_placeholder') || 'e.g. OSHA Safety Certification'}
          maxlength={255}
        />
      </div>

      <div class="flex flex-col gap-1.5">
        <Label for="program-description">{$t('programs.create_modal.description_label') || 'Description'}</Label>
        <Textarea
          id="program-description"
          bind:value={description}
          placeholder={$t('programs.create_modal.description_placeholder') || 'What is this program about?'}
          rows={3}
          maxlength={2000}
        />
      </div>
    </div>

    <Dialog.Footer>
      <Button variant="outline" onclick={handleCancel}>{$t('app.cancel') || 'Cancel'}</Button>
      <Button onclick={handleCreate} disabled={!name.trim() || programApi.isLoading}>
        {$t('programs.create_modal.submit') || 'Create'}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
