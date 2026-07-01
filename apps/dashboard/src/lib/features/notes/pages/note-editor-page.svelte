<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import HistoryIcon from '@lucide/svelte/icons/history';
  import LoaderIcon from '@lucide/svelte/icons/loader';
  import { Button } from '@cio/ui/base/button';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import type { Content, TiptapEditor } from '@cio/ui/custom/editor';
  import { Input } from '@cio/ui/base/input';
  import { TextEditor } from '$features/ui';
  import { currentOrgPath } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import { notesApi } from '../api';
  import NoteVersionHistory from '../components/note-version-history.svelte';

  interface Props {
    noteId: string;
  }

  let { noteId }: Props = $props();

  let title = $state('');
  let content = $state('');
  let isLoading = $state(true);
  let isSaving = $state(false);
  let loadError = $state<string | null>(null);
  let showVersionHistory = $state(false);
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  let titleSaveTimer: ReturnType<typeof setTimeout> | null = null;

  async function loadNote() {
    isLoading = true;
    loadError = null;

    const note = await notesApi.getNote(noteId);

    if (!note) {
      loadError = t.get('notes.editor.load_error');
      isLoading = false;
      return;
    }

    title = note.title;
    content = note.content;
    isLoading = false;
  }

  async function persistContent(nextContent: string) {
    isSaving = true;
    await notesApi.updateNote(noteId, { content: nextContent });
    isSaving = false;
  }

  async function persistTitle(nextTitle: string) {
    isSaving = true;
    await notesApi.updateNote(noteId, { title: nextTitle });
    isSaving = false;
  }

  function scheduleContentSave(nextContent: Content) {
    const html = `${nextContent}`;
    content = html;

    if (saveTimer) {
      clearTimeout(saveTimer);
    }

    saveTimer = setTimeout(() => {
      void persistContent(html);
    }, 800);
  }

  function scheduleTitleSave(event: Event) {
    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement)) return;

    const nextTitle = input.value.trim() || t.get('notes.org.new_note_title');
    title = nextTitle;

    if (titleSaveTimer) {
      clearTimeout(titleSaveTimer);
    }

    titleSaveTimer = setTimeout(() => {
      void persistTitle(nextTitle);
    }, 500);
  }

  function handleBack() {
    void goto(resolve(`${$currentOrgPath}/notes`, {}));
  }

  function handleVersionRestore(restoredContent: string) {
    content = restoredContent;
    showVersionHistory = false;
  }

  $effect(() => {
    noteId;
    void loadNote();
  });

  $effect(() => {
    return () => {
      if (saveTimer) {
        clearTimeout(saveTimer);
      }

      if (titleSaveTimer) {
        clearTimeout(titleSaveTimer);
      }
    };
  });
</script>

<div class="flex min-h-[calc(100vh-8rem)] flex-col">
  <header class="border-border flex items-center gap-3 border-b pb-4">
    <IconButton variant="secondary" size="icon" onclick={handleBack}>
      <ArrowLeftIcon size={16} />
    </IconButton>

    <Input
      value={title}
      class="max-w-xl border-none text-lg font-semibold shadow-none focus-visible:ring-0"
      placeholder={$t('notes.editor.title_placeholder')}
      oninput={scheduleTitleSave}
    />

    <div class="ml-auto flex items-center gap-2">
      {#if isSaving}
        <LoaderIcon size={16} class="ui:text-muted-foreground animate-spin" />
      {/if}

      <Button variant="secondary" size="sm" onclick={() => (showVersionHistory = true)}>
        <HistoryIcon size={16} />
        {$t('notes.editor.version_history.open')}
      </Button>
    </div>
  </header>

  <div class="min-h-0 flex-1 py-4">
    {#if isLoading}
      <div class="ui:text-muted-foreground flex h-40 items-center justify-center text-sm">
        <LoaderIcon size={18} class="mr-2 animate-spin" />
        {$t('notes.editor.loading')}
      </div>
    {:else if loadError}
      <p class="ui:text-destructive text-sm">{loadError}</p>
    {:else}
      <div class="min-h-[60vh]">
        <TextEditor
          {content}
          showToolBar={true}
          onChange={scheduleContentSave}
          placeholder={$t('notes.editor.placeholder')}
        />
      </div>
    {/if}
  </div>
</div>

<NoteVersionHistory
  {noteId}
  open={showVersionHistory}
  onClose={() => (showVersionHistory = false)}
  onRestore={handleVersionRestore}
/>
