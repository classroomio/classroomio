<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { Empty } from '@cio/ui/custom/empty';
  import { Button } from '@cio/ui/base/button';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import FileTextIcon from '@lucide/svelte/icons/file-text';
  import { currentOrg, currentOrgPath } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { t } from '$lib/utils/functions/translations';
  import { notesApi } from '../api';
  import NoteListSidebar from '../components/note-list-sidebar.svelte';
  import NoteTemplatesBrowser from '../components/note-templates-browser.svelte';
  import NoteEditorPage from './note-editor-page.svelte';

  interface Props {
    noteId?: string | null;
  }

  let { noteId = null }: Props = $props();
  let isCreating = $state(false);
  let hasCheckedRedirect = $state(false);
  let showTemplatesBrowser = $state(false);

  const workspaceNotes = $derived(
    [...notesApi.notes]
      .filter((note) => note.origin === 'workspace' && !note.isTemplate)
      .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
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

  $effect(() => {
    if (!$profile.id || !$currentOrg.id) {
      return;
    }

    notesApi.listNotes({ scope: 'all', origin: 'workspace' });
    notesApi.fetchUsage();
  });

  $effect(() => {
    if (noteId || notesApi.isLoading || hasCheckedRedirect) {
      return;
    }

    if (workspaceNotes.length === 0) {
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
  });
</script>

<div class="flex h-[calc(100dvh-4rem)] w-full min-w-0 overflow-hidden">
  <NoteListSidebar selectedNoteId={noteId} onBrowseTemplates={() => (showTemplatesBrowser = true)} />

  <section class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
    {#if noteId}
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

<NoteTemplatesBrowser bind:open={showTemplatesBrowser} />
