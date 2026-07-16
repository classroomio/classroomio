<script lang="ts">
  import CopyIcon from '@lucide/svelte/icons/copy';
  import * as Dialog from '@cio/ui/base/dialog';
  import * as RadioGroup from '@cio/ui/base/radio-group';
  import { Label } from '@cio/ui/base/label';
  import { Button } from '@cio/ui/base/button';
  import { Input } from '@cio/ui/base/input';
  import { currentOrg } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import { slugifyTitle } from '@cio/utils/validation/shared/slug';
  import { notesApi } from '../api';
  import { buildPublicNoteUrl } from '../utils/note-public-url';
  import type { NoteShareVisibility } from '../utils/types';

  interface Props {
    noteId: string;
    noteTitle?: string;
    visibility?: NoteShareVisibility;
    noteSlug?: string | null;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    onVisibilityChange?: (visibility: NoteShareVisibility, slug?: string | null) => void;
  }

  let {
    noteId,
    noteTitle = '',
    visibility = 'private',
    noteSlug = null,
    open = $bindable(false),
    onOpenChange,
    onVisibilityChange
  }: Props = $props();

  let selectedVisibility = $state<NoteShareVisibility>('private');
  let slugValue = $state('');
  let savedSlug = $state<string | null>(null);
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
    },
    {
      value: 'public' as const,
      label: t.get('notes.share.public_label'),
      description: t.get('notes.share.public_description')
    }
  ]);

  const publicUrl = $derived(savedSlug ? buildPublicNoteUrl($currentOrg, savedSlug) : '');

  async function handleSave() {
    isSaving = true;
    const slug = selectedVisibility === 'public' ? slugValue.trim() || slugifyTitle(noteTitle) : undefined;
    const updated = await notesApi.updateNoteVisibility(noteId, selectedVisibility, slug);
    isSaving = false;

    if (!updated) {
      snackbar.error('notes.share.save_error');
      return;
    }

    savedSlug = updated.slug ?? null;
    snackbar.success('notes.share.save_success');
    onVisibilityChange?.(selectedVisibility, savedSlug);
    open = false;
  }

  async function handleCopyLink() {
    if (!publicUrl) {
      return;
    }

    await navigator.clipboard.writeText(publicUrl);
    snackbar.success('notes.share.copy_success');
  }

  $effect(() => {
    if (!open) {
      return;
    }

    selectedVisibility = visibility;
    savedSlug = noteSlug;
    slugValue = noteSlug ?? slugifyTitle(noteTitle);
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

    {#if selectedVisibility === 'public'}
      <div class="space-y-2 pb-2">
        <Label for="note-public-slug">{$t('notes.share.public_slug_label')}</Label>
        <Input id="note-public-slug" bind:value={slugValue} placeholder={slugifyTitle(noteTitle)} />
        <p class="ui:text-muted-foreground text-xs">{$t('notes.share.public_slug_hint')}</p>
      </div>
    {/if}

    {#if publicUrl}
      <div class="ui:bg-muted/30 flex items-center gap-2 rounded-lg border px-3 py-2">
        <p class="min-w-0 flex-1 truncate text-xs">{publicUrl}</p>
        <Button size="icon-sm" variant="secondary" onclick={handleCopyLink}>
          <CopyIcon size={14} />
        </Button>
      </div>
    {/if}

    <Dialog.Footer>
      <Button variant="secondary" onclick={() => (open = false)}>{$t('notes.share.cancel')}</Button>
      <Button loading={isSaving} onclick={handleSave}>{$t('notes.share.save')}</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
