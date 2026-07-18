<script lang="ts">
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import GlobeIcon from '@lucide/svelte/icons/globe';
  import LayoutTemplateIcon from '@lucide/svelte/icons/layout-template';
  import LockIcon from '@lucide/svelte/icons/lock';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import UsersIcon from '@lucide/svelte/icons/users';
  import { Button } from '@cio/ui/base/button';
  import { Input } from '@cio/ui/base/input';
  import * as Select from '@cio/ui/base/select';
  import { Spinner } from '@cio/ui/base/spinner';
  import { cn } from '@cio/ui/tools';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { currentOrgPath } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { t } from '$lib/utils/functions/translations';
  import { tagApi } from '$features/tag/api';
  import { notesApi, type NoteListItem } from '../api';
  import type { NoteListScope } from '../utils/types';
  import {
    buildNoteListSections,
    displayNoteTitle,
    formatPinnedNoteDate,
    formatRecentNoteMeta
  } from '../utils/note-list-utils';

  interface Props {
    selectedNoteId?: string | null;
    listScope?: NoteListScope;
    searchValue?: string;
    selectedTagFilter?: string;
    onBrowseTemplates?: () => void;
    onListScopeChange?: (scope: NoteListScope) => void;
    onSearchValueChange?: (value: string) => void;
    onSelectedTagFilterChange?: (value: string) => void;
    class?: string;
  }

  let {
    selectedNoteId = null,
    listScope = 'all',
    searchValue = '',
    selectedTagFilter = 'all',
    onBrowseTemplates,
    onListScopeChange,
    onSearchValueChange,
    onSelectedTagFilterChange,
    class: className = ''
  }: Props = $props();

  let isCreating = $state(false);
  let pinnedExpanded = $state(true);

  const scopeOptions = $derived([
    { value: 'all' as const, label: t.get('notes.list.tabs.all') },
    { value: 'mine' as const, label: t.get('notes.list.tabs.mine') },
    { value: 'team' as const, label: t.get('notes.list.tabs.shared_with_me') }
  ]);

  const tagFilterOptions = $derived.by(() => {
    const options = [{ value: 'all', label: t.get('notes.tags.filter_all') }];

    for (const group of tagApi.tagGroups) {
      for (const tag of group.tags) {
        options.push({ value: tag.id, label: tag.name });
      }
    }

    return options;
  });

  const workspaceNotes = $derived(
    [...notesApi.notes]
      .filter((note) => note.origin === 'workspace' && !note.isTemplate)
      .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
  );

  const noteSections = $derived(buildNoteListSections(workspaceNotes));

  const emptyMessage = $derived.by(() => {
    if (searchValue.trim() || selectedTagFilter !== 'all') {
      return t.get('notes.workspace.empty_filtered');
    }

    if (listScope === 'team') {
      return t.get('notes.workspace.empty_shared');
    }

    if (listScope === 'mine') {
      return t.get('notes.workspace.empty_mine');
    }

    return t.get('notes.workspace.no_notes');
  });

  function noteHref(noteId: string) {
    return resolve(`${$currentOrgPath}/notes/${noteId}`, {});
  }

  function noteLinkClass(noteId: string) {
    return cn(
      'mx-2 block rounded-md px-3 py-2.5 transition-colors',
      selectedNoteId === noteId ? 'bg-amber-500/25' : 'ui:hover:bg-muted/60'
    );
  }

  function visibilityMeta(note: NoteListItem) {
    if (note.visibility === 'public') {
      return {
        icon: GlobeIcon,
        label: t.get('notes.list.badge_public')
      };
    }

    if (note.visibility === 'team') {
      return {
        icon: UsersIcon,
        label:
          note.ownerId === $profile.id ? t.get('notes.list.badge_shared_by_me') : t.get('notes.list.shared_with_team')
      };
    }

    return {
      icon: LockIcon,
      label: t.get('notes.list.badge_private')
    };
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
    void tagApi.getTagGroups();
  });
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

  <div class="border-border space-y-2 border-b px-3 py-2">
    <div class="grid grid-cols-3 gap-1 rounded-md border p-0.5">
      {#each scopeOptions as option (option.value)}
        <button
          type="button"
          class={cn(
            'rounded px-1.5 py-1 text-[11px] font-medium transition-colors',
            listScope === option.value ? 'ui:bg-background shadow-sm' : 'ui:text-muted-foreground ui:hover:bg-muted/60'
          )}
          onclick={() => onListScopeChange?.(option.value)}
        >
          {option.label}
        </button>
      {/each}
    </div>

    <Input
      value={searchValue}
      placeholder={$t('notes.list.search')}
      class="h-8"
      oninput={(event) => onSearchValueChange?.((event.currentTarget as HTMLInputElement).value)}
    />

    <Select.Root
      type="single"
      value={selectedTagFilter}
      onValueChange={(value) => {
        if (value) onSelectedTagFilterChange?.(value);
      }}
    >
      <Select.Trigger class="h-8 w-full text-xs">
        {tagFilterOptions.find((option) => option.value === selectedTagFilter)?.label ?? $t('notes.tags.filter_all')}
      </Select.Trigger>
      <Select.Content>
        {#each tagFilterOptions as option (option.value)}
          <Select.Item value={option.value}>{option.label}</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>

    <Button variant="ghost" size="sm" class="h-8 w-full justify-start gap-2 px-2" onclick={() => onBrowseTemplates?.()}>
      <LayoutTemplateIcon size={16} />
      {$t('notes.templates.browse')}
    </Button>
  </div>

  <div class="min-h-0 flex-1 overflow-y-auto">
    {#if notesApi.isLoading}
      <div class="flex justify-center py-8">
        <Spinner />
      </div>
    {:else if workspaceNotes.length === 0}
      <p class="ui:text-muted-foreground flex min-h-48 items-center justify-center px-4 text-center text-sm">
        {emptyMessage}
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
                  {@const visibility = visibilityMeta(note)}
                  <li>
                    <a href={noteHref(note.id)} class={noteLinkClass(note.id)}>
                      <div class="flex items-start justify-between gap-2">
                        <p class="line-clamp-2 text-sm leading-snug font-semibold">{displayNoteTitle(note.title)}</p>
                        <visibility.icon size={12} class="ui:text-muted-foreground mt-0.5 shrink-0" />
                      </div>
                      <p class="ui:text-muted-foreground mt-1 text-[11px] tracking-wide uppercase">
                        {formatPinnedNoteDate(note.updatedAt)}
                      </p>
                      {#if note.ownerId !== $profile.id && note.ownerFullname}
                        <p class="ui:text-muted-foreground mt-0.5 text-[11px]">
                          {$t('notes.list.by_author', { name: note.ownerFullname })}
                        </p>
                      {/if}
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
                {@const visibility = visibilityMeta(note)}
                <li>
                  <a href={noteHref(note.id)} class={noteLinkClass(note.id)}>
                    <div class="flex items-start justify-between gap-2">
                      <p class="line-clamp-2 text-sm leading-snug font-semibold">{displayNoteTitle(note.title)}</p>
                      <visibility.icon
                        size={12}
                        class="ui:text-muted-foreground mt-0.5 shrink-0"
                        aria-label={visibility.label}
                      />
                    </div>
                    <p class="ui:text-muted-foreground mt-1 line-clamp-2 text-xs">
                      {formatRecentNoteMeta(note.updatedAt, note)}
                    </p>
                    {#if note.ownerId !== $profile.id && note.ownerFullname}
                      <p class="ui:text-muted-foreground mt-0.5 text-[11px]">
                        {$t('notes.list.by_author', { name: note.ownerFullname })}
                      </p>
                    {/if}
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
