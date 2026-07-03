<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import UploadIcon from '@lucide/svelte/icons/upload';
  import { Button } from '@cio/ui/base/button';
  import * as Select from '@cio/ui/base/select';
  import { profile } from '$lib/utils/store/user';
  import { currentOrg, currentOrgPath } from '$lib/utils/store/org';
  import { openUpgradeModal } from '$lib/utils/functions/org';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import { tagApi } from '$features/tag/api';
  import { notesApi } from '../api';
  import MyNotesPage from './my-notes-page.svelte';

  let importInputRef = $state<HTMLInputElement | null>(null);
  let isCreating = $state(false);
  let isImporting = $state(false);
  let selectedTagFilter = $state('all');

  const workspaceLimitReached = $derived(
    notesApi.usage !== null &&
      notesApi.usage.limit !== null &&
      notesApi.usage.remaining !== null &&
      notesApi.usage.remaining <= 0
  );

  const tagFilterOptions = $derived.by(() => {
    const options = [{ value: 'all', label: t.get('notes.tags.filter_all') }];

    for (const group of tagApi.tagGroups) {
      for (const tag of group.tags) {
        options.push({ value: tag.id, label: tag.name });
      }
    }

    return options;
  });

  const activeTagId = $derived(selectedTagFilter === 'all' ? undefined : selectedTagFilter);

  function noteEditorHref(noteId: string) {
    return resolve(`${$currentOrgPath}/notes/${noteId}`, {});
  }

  function assertWorkspaceCreationAllowed() {
    if (workspaceLimitReached) {
      openUpgradeModal();
      return false;
    }

    return true;
  }

  async function handleCreateNote() {
    if (!assertWorkspaceCreationAllowed()) return;

    isCreating = true;
    const note = await notesApi.createWorkspaceNote(t.get('notes.org.new_note_title'));

    isCreating = false;

    if (!note) {
      snackbar.error('notes.org.create_error');
      return;
    }

    await goto(noteEditorHref(note.id));
  }

  async function handleImportFile(file: File) {
    if (!assertWorkspaceCreationAllowed()) return;

    isImporting = true;
    const note = await notesApi.importNote(file);
    isImporting = false;

    if (!note) {
      snackbar.error('notes.org.import_error');
      return;
    }

    snackbar.success('notes.org.import_success');
    await goto(noteEditorHref(note.id));
  }

  function handleImportClick() {
    importInputRef?.click();
  }

  function handleImportInputChange(event: Event) {
    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement)) return;

    const file = input.files?.[0];
    input.value = '';

    if (!file) return;

    void handleImportFile(file);
  }

  $effect(() => {
    if (!$profile.id || !$currentOrg.id) return;

    void tagApi.getTagGroups();
  });
</script>

<input
  bind:this={importInputRef}
  type="file"
  accept=".md,.txt,.docx,text/markdown,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  class="hidden"
  onchange={handleImportInputChange}
/>

<div class="flex flex-col gap-4">
  <div class="flex flex-wrap items-center gap-2">
    <Button loading={isCreating} onclick={handleCreateNote}>
      <PlusIcon size={16} />
      {$t('notes.org.new_note')}
    </Button>

    <Button variant="secondary" loading={isImporting} onclick={handleImportClick}>
      <UploadIcon size={16} />
      {$t('notes.org.import')}
    </Button>

    <Select.Root type="single" bind:value={selectedTagFilter}>
      <Select.Trigger class="w-[220px]">
        {tagFilterOptions.find((option) => option.value === selectedTagFilter)?.label ?? $t('notes.tags.filter_all')}
      </Select.Trigger>
      <Select.Content>
        {#each tagFilterOptions as option (option.value)}
          <Select.Item value={option.value}>{option.label}</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
  </div>

  <MyNotesPage showWorkspaceUsage={true} noteHref={noteEditorHref} tagId={activeTagId} showTeamTab={true} />
</div>
