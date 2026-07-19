<script lang="ts">
  import StarIcon from '@lucide/svelte/icons/star';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { Spinner } from '@cio/ui/base/spinner';
  import { cn } from '@cio/ui/tools';
  import { currentOrg, currentOrgPath } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { t } from '$lib/utils/functions/translations';
  import { notesApi } from '../api';
  import NoteSidebarFooter from './note-sidebar-footer.svelte';
  import NoteSidebarNewNote from './note-sidebar-new-note.svelte';
  import NoteSidebarSearch from './note-sidebar-search.svelte';
  import NoteSidebarSection from './note-sidebar-section.svelte';
  import NoteSidebarTree from './note-sidebar-tree.svelte';
  import {
    buildNoteTree,
    partitionSidebarSections,
    readExpandedNoteIds,
    writeExpandedNoteIds
  } from '../utils/note-tree-utils';
  import { displayNoteTitle } from '../utils/note-list-utils';

  interface Props {
    selectedNoteId?: string | null;
    onSearchClick?: () => void;
    class?: string;
  }

  let { selectedNoteId = null, onSearchClick, class: className = '' }: Props = $props();

  let isCreating = $state(false);
  let expandedIds = $state<Set<string>>(new Set());
  let sectionExpanded = $state({
    favorites: true,
    private: true,
    shared: true,
    workspace: true
  });

  const sections = $derived(partitionSidebarSections(notesApi.sidebarNotes, $profile.id ?? ''));
  const privateTree = $derived(buildNoteTree(sections.private));
  const workspaceTree = $derived(buildNoteTree(sections.workspace));
  const sharedTree = $derived(buildNoteTree(sections.shared));

  const templatesHref = $derived(resolve(`${$currentOrgPath}/notes/templates`, {}));
  const trashHref = $derived(resolve(`${$currentOrgPath}/notes/trash`, {}));

  const sectionConfig = $derived([
    {
      key: 'favorites' as const,
      title: $t('notes.sidebar.sections.favorites'),
      notes: sections.favorites,
      type: 'flat' as const
    },
    {
      key: 'private' as const,
      title: $t('notes.sidebar.sections.private'),
      notes: sections.private,
      type: 'tree' as const,
      tree: privateTree
    },
    {
      key: 'shared' as const,
      title: $t('notes.sidebar.sections.shared_with_me'),
      notes: sections.shared,
      type: 'tree' as const,
      tree: sharedTree
    },
    {
      key: 'workspace' as const,
      title: $t('notes.sidebar.sections.workspace'),
      notes: sections.workspace,
      type: 'tree' as const,
      tree: workspaceTree
    }
  ]);

  function noteHref(noteId: string) {
    return resolve(`${$currentOrgPath}/notes/${noteId}`, {});
  }

  function noteLinkClass(noteId: string) {
    return cn(
      'mx-2 flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
      selectedNoteId === noteId ? 'bg-primary/10 text-foreground' : 'ui:hover:bg-muted/60'
    );
  }

  function toggleExpanded(noteId: string) {
    const next = new Set(expandedIds);

    if (next.has(noteId)) {
      next.delete(noteId);
    } else {
      next.add(noteId);
    }

    expandedIds = next;

    if ($currentOrg.id) {
      writeExpandedNoteIds($currentOrg.id, next);
    }
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
    if ($currentOrg.id) {
      expandedIds = readExpandedNoteIds($currentOrg.id);
    }
  });
</script>

<aside class={cn('border-border ui:bg-muted/30 flex h-full min-h-0 w-72 shrink-0 flex-col border-r', className)}>
  <div class="space-y-1 py-3">
    <NoteSidebarSearch onclick={() => onSearchClick?.()} />
    <NoteSidebarNewNote loading={isCreating} onclick={handleCreateNote} />
  </div>

  <div class="min-h-0 flex-1 overflow-y-auto">
    {#if notesApi.isLoading}
      <div class="flex justify-center py-8">
        <Spinner />
      </div>
    {:else}
      {#each sectionConfig as section (section.key)}
        <NoteSidebarSection
          title={section.title}
          expanded={sectionExpanded[section.key]}
          onToggle={() => (sectionExpanded[section.key] = !sectionExpanded[section.key])}
        >
          {#if section.notes.length === 0}
            <p class="ui:text-muted-foreground px-4 py-2 text-xs">{$t('notes.sidebar.section_empty')}</p>
          {:else if section.type === 'flat'}
            <ul>
              {#each section.notes as note (note.id)}
                <li>
                  <a href={noteHref(note.id)} class={noteLinkClass(note.id)}>
                    <StarIcon size={14} class="shrink-0 text-amber-500" />
                    <span class="line-clamp-2 leading-snug">{displayNoteTitle(note.title)}</span>
                  </a>
                </li>
              {/each}
            </ul>
          {:else}
            <NoteSidebarTree
              nodes={section.tree}
              {selectedNoteId}
              {expandedIds}
              {noteHref}
              onToggleExpanded={toggleExpanded}
            />
          {/if}
        </NoteSidebarSection>
      {/each}
    {/if}
  </div>

  <NoteSidebarFooter {templatesHref} {trashHref} />
</aside>
