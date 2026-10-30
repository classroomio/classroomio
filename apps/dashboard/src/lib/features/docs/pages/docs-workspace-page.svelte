<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';
  import { Empty } from '@cio/ui/custom/empty';
  import { Button } from '@cio/ui/base/button';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import FileTextIcon from '@lucide/svelte/icons/file-text';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import { currentOrg, currentOrgPath } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { t } from '$lib/utils/functions/translations';
  import { docsApi } from '../api';
  import NoteListSidebar from '../components/doc-list-sidebar.svelte';
  import NoteSearchModal from '../components/doc-search-modal.svelte';
  import NoteEditorPage from './doc-editor-page.svelte';
  import NoteTemplatesPage from './doc-templates-page.svelte';
  import { displayNoteTitle } from '../utils/doc-list-utils';

  export type NotesWorkspaceMode = 'workspace' | 'trash' | 'templates';

  interface Props {
    docId?: string | null;
    mode?: NotesWorkspaceMode;
  }

  let { docId = null, mode = 'workspace' }: Props = $props();
  let isCreating = $state(false);
  let hasCheckedRedirect = $state(false);
  let showSearchModal = $state(false);

  const privateRootNotes = $derived(
    docsApi.sidebarNotes.filter((note) => note.ownerId === $profile.id && !note.parentId && note.visibility !== 'team')
  );

  function noteHref(targetNoteId: string) {
    return resolve(`${$currentOrgPath}/docs/${targetNoteId}`, {});
  }

  async function handleCreateNote() {
    isCreating = true;
    const note = await docsApi.createOrganizationDoc(t.get('docs.org.new_note_title'));
    isCreating = false;

    if (!note) {
      return;
    }

    await goto(noteHref(note.id));
  }

  async function handleRestore(docIdToRestore: string) {
    const restored = await docsApi.restoreDoc(docIdToRestore);

    if (restored) {
      await docsApi.listTrash();
      await docsApi.listSidebar();
      await goto(noteHref(docIdToRestore));
    }
  }

  async function handlePermanentDelete(docIdToDelete: string) {
    const deleted = await docsApi.permanentDeleteNote(docIdToDelete);

    if (deleted) {
      await docsApi.listTrash();
    }
  }

  $effect(() => {
    if (!$profile.id || !$currentOrg.id) {
      return;
    }

    docsApi.listSidebar();
    docsApi.fetchUsage();

    if (mode === 'trash') {
      docsApi.listTrash();
    }
  });

  $effect(() => {
    if (mode !== 'organization' || docId || docsApi.isLoading || hasCheckedRedirect) {
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

    const openSearch = () => {
      showSearchModal = true;
    };

    window.addEventListener('notes:open-search', openSearch);

    return () => {
      window.removeEventListener('notes:open-search', openSearch);
    };
  });
</script>

<div class="flex h-full min-h-0 w-full overflow-hidden">
  <NoteListSidebar selectedNoteId={docId} onSearchClick={() => (showSearchModal = true)} />

  <section class="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
    {#if mode === 'trash'}
      <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div class="border-border border-b px-6 py-4">
          <h1 class="text-lg font-semibold">{$t('docs.trash.title')}</h1>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto p-6">
          {#if docsApi.isLoading}
            <p class="ui:text-muted-foreground text-sm">{$t('docs.editor.loading')}</p>
          {:else if docsApi.trashedNotes.length === 0}
            <Empty title={$t('docs.trash.title')} description={$t('docs.trash.empty')} icon={Trash2Icon} />
          {:else}
            <ul class="space-y-2">
              {#each docsApi.trashedNotes as note (note.id)}
                <li class="border-border flex items-center justify-between gap-4 rounded-lg border px-4 py-3">
                  <div class="min-w-0">
                    <p class="truncate font-medium">{displayNoteTitle(note.title)}</p>
                    <p class="ui:text-muted-foreground text-xs">
                      {new Date(note.deletedAt ?? note.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <div class="flex shrink-0 items-center gap-2">
                    <Button variant="outline" size="sm" onclick={() => handleRestore(note.id)}>
                      {$t('docs.trash.restore')}
                    </Button>
                    <Button variant="destructive" size="sm" onclick={() => handlePermanentDelete(note.id)}>
                      {$t('docs.trash.delete_forever')}
                    </Button>
                  </div>
                </li>
              {/each}
            </ul>
          {/if}
        </div>
      </div>
    {:else if mode === 'templates'}
      <NoteTemplatesPage />
    {:else if docId}
      <NoteEditorPage {docId} />
    {:else if docsApi.isLoading}
      <div class="ui:text-muted-foreground flex flex-1 items-center justify-center text-sm">
        {$t('docs.editor.loading')}
      </div>
    {:else}
      <div class="flex flex-1 items-center justify-center p-6">
        <Empty
          title={$t('docs.workspace.empty_title')}
          description={$t('docs.workspace.empty_description')}
          icon={FileTextIcon}
        >
          <Button loading={isCreating} onclick={handleCreateNote}>
            <PlusIcon size={16} />
            {$t('docs.workspace.create_note')}
          </Button>
        </Empty>
      </div>
    {/if}
  </section>
</div>

<NoteSearchModal bind:open={showSearchModal} {noteHref} />
