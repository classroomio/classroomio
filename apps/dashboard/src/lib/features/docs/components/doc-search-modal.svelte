<script lang="ts">
  import FileTextIcon from '@lucide/svelte/icons/file-text';
  import * as Command from '@cio/ui/base/command';
  import { Badge } from '@cio/ui/base/badge';
  import { goto } from '$app/navigation';
  import { currentOrg } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import { tagApi } from '$features/tag/api';
  import { docsApi, type SidebarDocItem } from '../api';
  import { displayNoteTitle } from '../utils/doc-list-utils';

  interface Props {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    noteHref: (docId: string) => string;
  }

  let { open = $bindable(false), onOpenChange, noteHref }: Props = $props();

  let query = $state('');
  let selectedTagId = $state<string>('all');

  const tagOptions = $derived.by(() => {
    const options = [{ id: 'all', name: t.get('docs.tags.filter_all') }];

    for (const group of tagApi.tagGroups) {
      for (const tag of group.tags) {
        options.push({ id: tag.id, name: tag.name });
      }
    }

    return options;
  });

  const results = $derived.by(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return docsApi.sidebarNotes.filter((note) => {
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

  function handleSelect(note: SidebarDocItem) {
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
    void docsApi.listSidebar();
  });
</script>

<Command.Dialog
  bind:open
  {onOpenChange}
  shouldFilter={false}
  title={$t('docs.sidebar.search_modal_title')}
  description={$t('docs.sidebar.search_modal_title')}
>
  <Command.Input bind:value={query} placeholder={$t('docs.sidebar.search_modal_title')} />

  <div class="flex flex-wrap gap-2 border-b px-2 py-2">
    {#each tagOptions as tag (tag.id)}
      <button type="button" onclick={() => (selectedTagId = tag.id)}>
        <Badge variant={selectedTagId === tag.id ? 'default' : 'secondary'}>{tag.name}</Badge>
      </button>
    {/each}
  </div>

  <Command.List class="ui:max-h-[360px] ui:p-2">
    {#if docsApi.isLoading && docsApi.sidebarNotes.length === 0}
      <div class="ui:text-muted-foreground ui:px-3 ui:py-8 ui:text-center ui:text-sm">
        {$t('docs.editor.loading')}
      </div>
    {:else if results.length === 0}
      <Command.Empty>{$t('docs.workspace.empty_filtered')}</Command.Empty>
    {:else}
      <Command.Group heading={$t('docs.heading')}>
        {#each results as note (note.id)}
          <Command.Item value={note.id} onSelect={() => handleSelect(note)}>
            <FileTextIcon class="ui:size-4 ui:text-muted-foreground" />
            <span class="truncate">{displayNoteTitle(note.title)}</span>
          </Command.Item>
        {/each}
      </Command.Group>
    {/if}
  </Command.List>
</Command.Dialog>
