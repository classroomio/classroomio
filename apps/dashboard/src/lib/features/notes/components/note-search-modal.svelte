<script lang="ts">
  import FileTextIcon from '@lucide/svelte/icons/file-text';
  import * as Command from '@cio/ui/base/command';
  import * as Dialog from '@cio/ui/base/dialog';
  import { Badge } from '@cio/ui/base/badge';
  import { Spinner } from '@cio/ui/base/spinner';
  import { goto } from '$app/navigation';
  import { currentOrg } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import { tagApi } from '$features/tag/api';
  import { notesApi, type NoteListItem } from '../api';
  import { displayNoteTitle } from '../utils/note-list-utils';

  interface Props {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    noteHref: (noteId: string) => string;
  }

  let { open = $bindable(false), onOpenChange, noteHref }: Props = $props();

  let query = $state('');
  let selectedTagId = $state<string>('all');
  let results = $state<NoteListItem[]>([]);
  let isSearching = $state(false);
  let searchTimer: ReturnType<typeof setTimeout> | null = null;

  const tagOptions = $derived.by(() => {
    const options = [{ id: 'all', name: t.get('notes.tags.filter_all') }];

    for (const group of tagApi.tagGroups) {
      for (const tag of group.tags) {
        options.push({ id: tag.id, name: tag.name });
      }
    }

    return options;
  });

  async function runSearch() {
    if (!$currentOrg.id) {
      return;
    }

    isSearching = true;

    await notesApi.listNotes({
      origin: 'workspace',
      scope: 'all',
      search: query.trim() || undefined,
      tagId: selectedTagId === 'all' ? undefined : selectedTagId
    });

    results = [...notesApi.notes];
    isSearching = false;
  }

  function scheduleSearch() {
    if (searchTimer) {
      clearTimeout(searchTimer);
    }

    searchTimer = setTimeout(() => {
      void runSearch();
    }, 250);
  }

  function handleSelect(noteId: string) {
    open = false;
    void goto(noteHref(noteId));
  }

  $effect(() => {
    if (!open) {
      return;
    }

    void tagApi.getTagGroups();
    void runSearch();
  });

  $effect(() => {
    if (!open) {
      return;
    }

    query;
    selectedTagId;
    scheduleSearch();
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
        {#if isSearching}
          <div class="flex justify-center py-8">
            <Spinner />
          </div>
        {:else if results.length === 0}
          <Command.Empty>{$t('notes.workspace.empty_filtered')}</Command.Empty>
        {:else}
          <Command.Group heading={$t('notes.heading')}>
            {#each results as note (note.id)}
              <Command.Item value={note.id} onSelect={() => handleSelect(note.id)}>
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
