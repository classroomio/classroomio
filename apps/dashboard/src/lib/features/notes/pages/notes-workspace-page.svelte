<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';
  import { Empty } from '@cio/ui/custom/empty';
  import { Button } from '@cio/ui/base/button';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import FileTextIcon from '@lucide/svelte/icons/file-text';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import LayoutTemplateIcon from '@lucide/svelte/icons/layout-template';
  import { currentOrg, currentOrgPath } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { t } from '$lib/utils/functions/translations';
  import { notesApi } from '../api';
  import NoteListSidebar from '../components/note-list-sidebar.svelte';
  import NoteEditorPage from './note-editor-page.svelte';
  import { displayNoteTitle } from '../utils/note-list-utils';

  export type NotesWorkspaceMode = 'workspace' | 'trash' | 'templates';

  interface Props {
    noteId?: string | null;
    mode?: NotesWorkspaceMode;
  }

  let { noteId = null, mode = 'workspace' }: Props = $props();
  let isCreating = $state(false);
  let hasCheckedRedirect = $state(false);

  const privateRootNotes = $derived(
    notesApi.sidebarNotes.filter((note) => note.ownerId === $profile.id && !note.parentId && note.visibility !== 'team')
  );

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

  async function handleRestore(noteIdToRestore: string) {
    const restored = await notesApi.restoreNote(noteIdToRestore);

    if (restored) {
      await notesApi.listTrash();
      await notesApi.listSidebar();
      await goto(noteHref(noteIdToRestore));
    }
  }

  async function handlePermanentDelete(noteIdToDelete: string) {
    const deleted = await notesApi.permanentDeleteNote(noteIdToDelete);

    if (deleted) {
      await notesApi.listTrash();
    }
  }

  $effect(() => {
    if (!$profile.id || !$currentOrg.id) {
      return;
    }

    notesApi.listSidebar();
    notesApi.fetchUsage();

    if (mode === 'trash') {
      notesApi.listTrash();
    }
  });

  $effect(() => {
    if (mode !== 'workspace' || noteId || notesApi.isLoading || hasCheckedRedirect) {
      return;
    }

    if (privateRootNotes.length === 0) {
      hasCheckedRedirect = true;
      return;
    }

    hasCheckedRedirect = true;
    void goto(noteHref(privateRootNotes[0].id));
  });

  onMount(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get('create') === '1') {
      void handleCreateNote();
    }
  });
</script>

<div class="flex min-h-0 flex-1 w-full overflow-hidden">
  <NoteListSidebar selectedNoteId={noteId} />

  <section class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
    {#if mode === 'trash'}
      <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div class="border-border border-b px-6 py-4">
          <h1 class="text-lg font-semibold">{$t('notes.trash.title')}</h1>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto p-6">
          {#if notesApi.isLoading}
            <p class="ui:text-muted-foreground text-sm">{$t('notes.editor.loading')}</p>
          {:else if notesApi.trashedNotes.length === 0}
            <Empty title={$t('notes.trash.title')} description={$t('notes.trash.empty')} icon={Trash2Icon} />
          {:else}
            <ul class="space-y-2">
              {#each notesApi.trashedNotes as note (note.id)}
                <li class="border-border flex items-center justify-between gap-4 rounded-lg border px-4 py-3">
                  <div class="min-w-0">
                    <p class="truncate font-medium">{displayNoteTitle(note.title)}</p>
                    <p class="ui:text-muted-foreground text-xs">
                      {new Date(note.deletedAt ?? note.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <div class="flex shrink-0 items-center gap-2">
                    <Button variant="outline" size="sm" onclick={() => handleRestore(note.id)}>
                      {$t('notes.trash.restore')}
                    </Button>
                    <Button variant="destructive" size="sm" onclick={() => handlePermanentDelete(note.id)}>
                      {$t('notes.trash.delete_forever')}
                    </Button>
                  </div>
                </li>
              {/each}
            </ul>
          {/if}
        </div>
      </div>
    {:else if mode === 'templates'}
      <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div class="border-border border-b px-6 py-4">
          <h1 class="text-lg font-semibold">{$t('notes.templates.page_title')}</h1>
          <p class="ui:text-muted-foreground mt-1 text-sm">{$t('notes.templates.page_subtitle')}</p>
        </div>
        <div class="flex flex-1 items-center justify-center p-6">
          <Empty
            title={$t('notes.templates.page_title')}
            description={$t('notes.templates.page_subtitle')}
            icon={LayoutTemplateIcon}
          />
        </div>
      </div>
    {:else if noteId}
      <NoteEditorPage {noteId} />
    {:else if notesApi.isLoading}
      <div class="ui:text-muted-foreground flex flex-1 items-center justify-center text-sm">
        {$t('notes.editor.loading')}
      </div>
    {:else}
      <div class="flex flex-1 items-center justify-center p-6">
        <Empty
          title={$t('notes.workspace.empty_title')}
          description={$t('notes.workspace.empty_description')}
          icon={FileTextIcon}
        >
          <Button loading={isCreating} onclick={handleCreateNote}>
            <PlusIcon size={16} />
            {$t('notes.workspace.create_note')}
          </Button>
        </Empty>
      </div>
    {/if}
  </section>
</div>
