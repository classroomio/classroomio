<script lang="ts">
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
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
  import {
    buildNoteListSections,
    displayNoteTitle,
    formatPinnedNoteDate,
    formatRecentNoteMeta
  } from '../utils/note-list-utils';

  interface Props {
    selectedNoteId?: string | null;
    onBrowseTemplates?: () => void;
    class?: string;
  }

  let { selectedNoteId = null, onBrowseTemplates, class: className = '' }: Props = $props();
  let isCreating = $state(false);
  let pinnedExpanded = $state(true);

  const workspaceNotes = $derived(
    [...notesApi.notes]
      .filter((note) => note.origin === 'workspace' && !note.isTemplate)
      .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
  );

  const noteSections = $derived(buildNoteListSections(workspaceNotes));

  function noteHref(noteId: string) {
    return resolve(`${$currentOrgPath}/notes/${noteId}`, {});
  }

  function noteLinkClass(noteId: string) {
    return cn(
      'mx-2 block rounded-md px-3 py-2.5 transition-colors',
      selectedNoteId === noteId ? 'bg-amber-500/25' : 'ui:hover:bg-muted/60'
    );
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

<aside class={cn('border-border ui:bg-muted/30 flex h-full min-h-0 w-72 shrink-0 flex-col border-r', className)}>
  <div class="border-border flex items-center justify-between gap-2 border-b px-4 py-3">
    <div class="min-w-0">
      <p class="text-sm font-semibold">{$t('notes.heading')}</p>
      <p class="ui:text-muted-foreground text-xs">
        {$t('notes.workspace.note_count', { count: workspaceNotes.length })}
      </p>
    </div>
    <Button size="icon-sm" variant="secondary" loading={isCreating} onclick={handleCreateNote}>
      <PlusIcon size={16} />
    </Button>
  </div>

  <div class="min-h-0 flex-1 overflow-y-auto">
    <div class="border-border border-b px-2 py-2">
      <Button
        variant="ghost"
        size="sm"
        class="h-8 w-full justify-start gap-2 px-2"
        onclick={() => onBrowseTemplates?.()}
      >
        <LayoutTemplateIcon size={16} />
        {$t('notes.templates.browse')}
      </Button>
    </div>

    {#if notesApi.isLoading}
      <div class="flex justify-center py-8">
        <Spinner />
      </div>
    {:else if workspaceNotes.length === 0}
      <p class="ui:text-muted-foreground flex min-h-48 items-center justify-center px-4 text-center text-sm">
        {$t('notes.workspace.no_notes')}
      </p>
    {:else}
      {#each noteSections as section (section.id)}
        <section class="border-border border-b py-1 last:border-b-0">
          {#if section.id === 'pinned'}
            <button
              type="button"
              class="ui:hover:bg-muted/40 flex w-full items-center gap-2 px-4 py-2 text-left"
              onclick={() => (pinnedExpanded = !pinnedExpanded)}
            >
              <ChevronDownIcon
                size={14}
                class={cn('ui:text-muted-foreground shrink-0 transition-transform', !pinnedExpanded && '-rotate-90')}
              />
              <span class="ui:text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                {section.label}
              </span>
            </button>

            {#if pinnedExpanded}
              <ul>
                {#each section.notes as note (note.id)}
                  <li>
                    <a href={noteHref(note.id)} class={noteLinkClass(note.id)}>
                      <p class="line-clamp-2 text-sm leading-snug font-semibold">{displayNoteTitle(note.title)}</p>
                      <p class="ui:text-muted-foreground mt-1 text-[11px] tracking-wide uppercase">
                        {formatPinnedNoteDate(note.updatedAt)}
                      </p>
                    </a>
                  </li>
                {/each}
              </ul>
            {/if}
          {:else}
            <div class="px-4 py-2">
              <p class="ui:text-muted-foreground text-xs font-semibold tracking-wide uppercase">{section.label}</p>
            </div>
            <ul>
              {#each section.notes as note (note.id)}
                <li>
                  <a href={noteHref(note.id)} class={noteLinkClass(note.id)}>
                    <p class="line-clamp-2 text-sm leading-snug font-semibold">{displayNoteTitle(note.title)}</p>
                    <p class="ui:text-muted-foreground mt-1 line-clamp-2 text-xs">
                      {formatRecentNoteMeta(note.updatedAt, note)}
                    </p>
                  </a>
                </li>
              {/each}
            </ul>
          {/if}
        </section>
      {/each}
    {/if}
  </div>
</aside>
