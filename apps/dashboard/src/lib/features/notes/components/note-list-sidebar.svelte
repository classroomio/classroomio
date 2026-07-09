<script lang="ts">
  import PlusIcon from '@lucide/svelte/icons/plus';
  import { Button } from '@cio/ui/base/button';
  import { Spinner } from '@cio/ui/base/spinner';
  import { cn } from '@cio/ui/tools';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { currentOrg, currentOrgPath } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { t } from '$lib/utils/functions/translations';
  import { notesApi } from '../api';
  import NoteTemplatesRow from './note-templates-row.svelte';

  interface Props {
    selectedNoteId?: string | null;
    class?: string;
  }

  let { selectedNoteId = null, class: className = '' }: Props = $props();
  let isCreating = $state(false);

  const workspaceNotes = $derived(
    [...notesApi.notes]
      .filter((note) => note.origin === 'workspace' && !note.isTemplate)
      .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
  );

  function noteHref(noteId: string) {
    return resolve(`${$currentOrgPath}/notes/${noteId}`, {});
  }

  function displayTitle(title: string) {
    const trimmedTitle = title.trim();

    return trimmedTitle === t.get('notes.org.new_note_title') || !trimmedTitle
      ? t.get('notes.org.new_note_title')
      : trimmedTitle;
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
</script>

<aside class={cn('border-border flex w-64 shrink-0 flex-col border-r bg-transparent', className)}>
  <div class="flex items-center justify-between gap-2 border-b px-3 py-3">
    <p class="text-sm font-semibold">{$t('notes.heading')}</p>
    <Button size="icon-sm" variant="secondary" loading={isCreating} onclick={handleCreateNote}>
      <PlusIcon size={16} />
    </Button>
  </div>

  <div class="min-h-0 flex-1 overflow-y-auto px-3 py-3">
    <NoteTemplatesRow {noteHref} class="mb-4" />

    {#if notesApi.isLoading}
      <div class="flex justify-center py-8">
        <Spinner />
      </div>
    {:else if workspaceNotes.length === 0}
      <p class="ui:text-muted-foreground px-1 py-8 text-center text-sm">{$t('notes.workspace.no_notes')}</p>
    {:else}
      <ul class="flex flex-col gap-1">
        {#each workspaceNotes as note (note.id)}
          <li>
            <a
              href={noteHref(note.id)}
              class={cn(
                'ui:hover:bg-muted/60 block rounded-md px-2 py-2 transition-colors',
                selectedNoteId === note.id && 'ui:bg-muted'
              )}
            >
              <p class="line-clamp-2 text-sm leading-snug font-medium">{displayTitle(note.title)}</p>
              <p class="ui:text-muted-foreground mt-1 line-clamp-2 text-xs">
                {note.plainText || $t('notes.list.no_content')}
              </p>
            </a>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</aside>
