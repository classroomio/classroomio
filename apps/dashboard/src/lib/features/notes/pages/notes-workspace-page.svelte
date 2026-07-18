<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { Empty } from '@cio/ui/custom/empty';
  import { Button } from '@cio/ui/base/button';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import FileTextIcon from '@lucide/svelte/icons/file-text';
  import UsersIcon from '@lucide/svelte/icons/users';
  import { currentOrg, currentOrgPath } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { t } from '$lib/utils/functions/translations';
  import { notesApi } from '../api';
  import NoteListSidebar from '../components/note-list-sidebar.svelte';
  import NoteTemplatesBrowser from '../components/note-templates-browser.svelte';
  import type { NoteListScope } from '../utils/types';
  import NoteEditorPage from './note-editor-page.svelte';

  interface Props {
    noteId?: string | null;
  }

  let { noteId = null }: Props = $props();
  let isCreating = $state(false);
  let hasCheckedRedirect = $state(false);
  let showTemplatesBrowser = $state(false);
  let listScope = $state<NoteListScope>('all');
  let searchValue = $state('');
  let debouncedSearch = $state('');
  let selectedTagFilter = $state('all');
  let searchTimer: ReturnType<typeof setTimeout> | null = null;

  const workspaceNotes = $derived(
    [...notesApi.notes]
      .filter((note) => note.origin === 'workspace' && !note.isTemplate)
      .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
  );

  const emptyTitle = $derived(
    listScope === 'team' ? t.get('notes.workspace.empty_shared_title') : t.get('notes.workspace.empty_title')
  );

  const emptyDescription = $derived(
    listScope === 'team'
      ? t.get('notes.workspace.empty_shared_description')
      : t.get('notes.workspace.empty_description')
  );

  const emptyIcon = $derived(listScope === 'team' ? UsersIcon : FileTextIcon);

  function noteHref(targetNoteId: string) {
    return resolve(`${$currentOrgPath}/notes/${targetNoteId}`, {});
  }

  async function handleCreateNote() {
    isCreating = true;
    const note = await notesApi.createWorkspaceNote(t.get('notes.org.new_note_title'));
    isCreating = false;

    if (!note) {
      return;
    }

    await goto(noteHref(note.id));
  }

  function handleSearchValueChange(value: string) {
    searchValue = value;

    if (searchTimer) {
      clearTimeout(searchTimer);
    }

    searchTimer = setTimeout(() => {
      debouncedSearch = value.trim();
    }, 250);
  }

  function handleListScopeChange(scope: NoteListScope) {
    listScope = scope;
    hasCheckedRedirect = false;
  }

  function handleSelectedTagFilterChange(value: string) {
    selectedTagFilter = value;
    hasCheckedRedirect = false;
  }

  $effect(() => {
    if (!$profile.id || !$currentOrg.id) {
      return;
    }

    notesApi.listNotes({
      scope: listScope,
      origin: 'workspace',
      search: debouncedSearch || undefined,
      tagId: selectedTagFilter === 'all' ? undefined : selectedTagFilter
    });
    notesApi.fetchUsage();
  });

  $effect(() => {
    if (noteId || notesApi.isLoading || hasCheckedRedirect) {
      return;
    }

    if (workspaceNotes.length === 0 || listScope === 'team' || debouncedSearch || selectedTagFilter !== 'all') {
      hasCheckedRedirect = true;
      return;
    }

    hasCheckedRedirect = true;
    void goto(noteHref(workspaceNotes[0].id));
  });

  onMount(() => {
    if (page.url.searchParams.get('create') === '1') {
      void handleCreateNote();
    }

    return () => {
      if (searchTimer) {
        clearTimeout(searchTimer);
      }
    };
  });
</script>

<div class="flex h-full min-h-0 w-full overflow-hidden">
  <NoteListSidebar
    selectedNoteId={noteId}
    {listScope}
    {searchValue}
    {selectedTagFilter}
    onBrowseTemplates={() => (showTemplatesBrowser = true)}
    onListScopeChange={handleListScopeChange}
    onSearchValueChange={handleSearchValueChange}
    onSelectedTagFilterChange={handleSelectedTagFilterChange}
  />

  <section class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
    {#if noteId}
      <NoteEditorPage {noteId} />
    {:else if notesApi.isLoading}
      <div class="ui:text-muted-foreground flex flex-1 items-center justify-center text-sm">
        {$t('notes.editor.loading')}
      </div>
    {:else}
      <div class="flex flex-1 items-center justify-center p-6">
        <Empty title={emptyTitle} description={emptyDescription} icon={emptyIcon}>
          {#if listScope !== 'team'}
            <Button loading={isCreating} onclick={handleCreateNote}>
              <PlusIcon size={16} />
              {$t('notes.workspace.create_note')}
            </Button>
          {/if}
        </Empty>
      </div>
    {/if}
  </section>
</div>

<NoteTemplatesBrowser bind:open={showTemplatesBrowser} />
