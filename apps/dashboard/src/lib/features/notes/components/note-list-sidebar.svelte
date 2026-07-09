<script lang="ts">
  import PlusIcon from '@lucide/svelte/icons/plus';
  import LayoutTemplateIcon from '@lucide/svelte/icons/layout-template';
  import { Button } from '@cio/ui/base/button';
  import { Spinner } from '@cio/ui/base/spinner';
  import { cn } from '@cio/ui/tools';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { currentOrgPath } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import { notesApi } from '../api';

  interface Props {
    selectedNoteId?: string | null;
    onBrowseTemplates?: () => void;
    class?: string;
  }

  let { selectedNoteId = null, onBrowseTemplates, class: className = '' }: Props = $props();
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
</script>

<aside
  class={cn(
    'border-border ui:bg-background sticky top-0 flex h-[calc(100dvh-4rem)] w-64 shrink-0 flex-col border-r',
    className
  )}
>
  <div class="flex items-center justify-between gap-2 border-b px-3 py-3">
    <p class="text-sm font-semibold">{$t('notes.heading')}</p>
    <Button size="icon-sm" variant="secondary" loading={isCreating} onclick={handleCreateNote}>
      <PlusIcon size={16} />
    </Button>
  </div>

  <div class="min-h-0 flex-1 overflow-y-auto px-3 py-3">
    <Button variant="secondary" size="sm" class="mb-4 w-full justify-start gap-2" onclick={() => onBrowseTemplates?.()}>
      <LayoutTemplateIcon size={16} />
      {$t('notes.templates.browse')}
    </Button>

    {#if notesApi.isLoading}
      <div class="flex justify-center py-8">
        <Spinner />
      </div>
    {:else if workspaceNotes.length === 0}
      <p class="ui:text-muted-foreground flex h-full min-h-48 items-center justify-center px-1 text-center text-sm">
        {$t('notes.workspace.no_notes')}
      </p>
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
