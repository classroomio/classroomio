<script lang="ts">
  import FileTextIcon from '@lucide/svelte/icons/file-text';
  import * as Command from '@cio/ui/base/command';
  import * as Dialog from '@cio/ui/base/dialog';
  import { Badge } from '@cio/ui/base/badge';
  import { goto } from '$app/navigation';
  import { currentOrg } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import { tagApi } from '$features/tag/api';
  import { notesApi, type SidebarNoteItem } from '../api';
  import { displayNoteTitle } from '../utils/note-list-utils';

  interface Props {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    noteHref: (noteId: string) => string;
  }

  let { open = $bindable(false), onOpenChange, noteHref }: Props = $props();

  let query = $state('');
  let selectedTagId = $state<string>('all');

  const tagOptions = $derived.by(() => {
    const options = [{ id: 'all', name: t.get('notes.tags.filter_all') }];

    for (const group of tagApi.tagGroups) {
      for (const tag of group.tags) {
        options.push({ id: tag.id, name: tag.name });
      }
    }

    return options;
  });

  const results = $derived.by(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return notesApi.sidebarNotes.filter((note) => {
      if (selectedTagId !== 'all' && !note.tags?.some((tag) => tag.id === selectedTagId)) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return (
        note.title.toLowerCase().includes(normalizedQuery) ||
        note.plainText.toLowerCase().includes(normalizedQuery)
      );
    });
  });

  function handleSelect(note: SidebarNoteItem) {
    open = false;
    void goto(noteHref(note.id));
  }

  $effect(() => {
    if (!open) {
      query = '';
      selectedTagId = 'all';
      return;
    }

    void tagApi.getTagGroups();
    void notesApi.listSidebar();
  });
</script>

<Dialog.Root bind:open {onOpenChange}>
  <Dialog.Content class="gap-0 overflow-hidden p-0 sm:max-w-xl">
    <Command.Root shouldFilter={false} class="border-0">
      <Command.Input
        bind:value={query}
        placeholder={$t('notes.sidebar.search_modal_title')}
        class="h-12 rounded-none border-0 border-b"
      />

      <div class="flex flex-wrap gap-2 border-b px-3 py-2">
        {#each tagOptions as tag (tag.id)}
          <button type="button" onclick={() => (selectedTagId = tag.id)}>
            <Badge variant={selectedTagId === tag.id ? 'default' : 'secondary'}>{tag.name}</Badge>
          </button>
        {/each}
      </div>

      <Command.List class="max-h-[360px]">
        {#if notesApi.isLoading && notesApi.sidebarNotes.length === 0}
          <div class="ui:text-muted-foreground px-3 py-8 text-center text-sm">
            {$t('notes.editor.loading')}
          </div>
        {:else if results.length === 0}
          <Command.Empty>{$t('notes.workspace.empty_filtered')}</Command.Empty>
        {:else}
          <Command.Group heading={$t('notes.heading')}>
            {#each results as note (note.id)}
              <Command.Item value={note.id} onSelect={() => handleSelect(note)}>
                <FileTextIcon size={16} class="ui:text-muted-foreground" />
                <span class="truncate">{displayNoteTitle(note.title)}</span>
              </Command.Item>
            {/each}
          </Command.Group>
        {/if}
      </Command.List>
    </Command.Root>
  </Dialog.Content>
</Dialog.Root>
