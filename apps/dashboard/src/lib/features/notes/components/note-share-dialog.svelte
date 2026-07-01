<script lang="ts">
  import * as Dialog from '@cio/ui/base/dialog';
  import * as RadioGroup from '@cio/ui/base/radio-group';
  import { Label } from '@cio/ui/base/label';
  import { Button } from '@cio/ui/base/button';
  import { currentOrg } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import { notesApi } from '../api';
  import type { NoteShareVisibility } from '../utils/types';

  interface Props {
    noteId: string;
    visibility?: NoteShareVisibility;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    onVisibilityChange?: (visibility: NoteShareVisibility) => void;
  }

  let { noteId, visibility = 'private', open = $bindable(false), onOpenChange, onVisibilityChange }: Props = $props();

  let selectedVisibility = $state<NoteShareVisibility>('private');
  let isSaving = $state(false);

  const visibilityOptions = $derived([
    {
      value: 'private' as const,
      label: t.get('notes.share.private_label'),
      description: t.get('notes.share.private_description')
    },
    {
      value: 'team' as const,
      label: t.get('notes.share.team_label'),
      description: t.get('notes.share.team_description', { orgName: $currentOrg.name })
    }
  ]);

  async function handleSave() {
    isSaving = true;
    const updated = await notesApi.updateNoteVisibility(noteId, selectedVisibility);
    isSaving = false;

    if (!updated) {
      snackbar.error('notes.share.save_error');
      return;
    }

    snackbar.success('notes.share.save_success');
    onVisibilityChange?.(selectedVisibility);
    open = false;
  }

  $effect(() => {
    if (open) {
      selectedVisibility = visibility;
    }
  });
</script>

<Dialog.Root bind:open {onOpenChange}>
  <Dialog.Content class="max-w-md">
    <Dialog.Header>
      <Dialog.Title>{$t('notes.share.title')}</Dialog.Title>
      <Dialog.Description>{$t('notes.share.description')}</Dialog.Description>
    </Dialog.Header>

    <RadioGroup.Root bind:value={selectedVisibility} class="gap-4 py-2">
      {#each visibilityOptions as option (option.value)}
        <div class="flex items-start gap-3 rounded-lg border p-3">
          <RadioGroup.Item value={option.value} id={`note-share-${option.value}`} class="mt-1" />
          <div class="space-y-1">
            <Label for={`note-share-${option.value}`} class="font-medium">{option.label}</Label>
            <p class="ui:text-muted-foreground text-sm">{option.description}</p>
          </div>
        </div>
      {/each}
    </RadioGroup.Root>

    <Dialog.Footer>
      <Button variant="secondary" onclick={() => (open = false)}>{$t('notes.share.cancel')}</Button>
      <Button loading={isSaving} onclick={handleSave}>{$t('notes.share.save')}</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
