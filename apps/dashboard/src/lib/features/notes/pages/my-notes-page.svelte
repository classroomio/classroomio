<script lang="ts">
  import * as UnderlineTabs from '@cio/ui/custom/underline-tabs';
  import * as Card from '@cio/ui/base/card';
  import { Badge } from '@cio/ui/base/badge';
  import { Search } from '@cio/ui/custom/search';
  import { Empty } from '@cio/ui/custom/empty';
  import { Spinner } from '@cio/ui/base/spinner';
  import * as Page from '@cio/ui/base/page';
  import { profile } from '$lib/utils/store/user';
  import { currentOrg } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import { notesApi } from '../api';
  import NoteTemplatesRow from '../components/note-templates-row.svelte';
  import type { NoteListItem } from '../api/notes.svelte';

  interface Props {
    showWorkspaceUsage?: boolean;
    noteHref?: (noteId: string) => string;
    tagId?: string;
    showTeamTab?: boolean;
    searchValue?: string;
    showSearch?: boolean;
  }

  let {
    showWorkspaceUsage = false,
    noteHref,
    tagId,
    showTeamTab = false,
    searchValue = $bindable(''),
    showSearch = true
  }: Props = $props();
  let currentTab = $state<'all' | 'lessons' | 'team'>('all');

  const listScope = $derived.by((): 'mine' | 'team' | 'all' => {
    if (!showTeamTab) {
      return 'mine';
    }

    if (currentTab === 'team') {
      return 'team';
    }

    if (currentTab === 'lessons') {
      return 'mine';
    }

    return 'all';
  });

  const filteredNotes = $derived.by(() => {
    const originFilter = currentTab === 'lessons' ? 'lesson_capture' : undefined;
    const term = searchValue.trim().toLowerCase();

    return notesApi.notes.filter((note) => {
      if (originFilter && note.origin !== originFilter) {
        return false;
      }

      if (!term) {
        return true;
      }

      return note.title.toLowerCase().includes(term) || note.plainText.toLowerCase().includes(term);
    });
  });

  const showTemplatesSection = $derived(showTeamTab || showWorkspaceUsage);

  function formatUpdatedAt(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  }

  $effect(() => {
    if (!$profile.id || !$currentOrg.id) return;

    listScope;
    tagId;

    notesApi.listNotes({ tagId, scope: listScope });

    if (showWorkspaceUsage) {
      notesApi.fetchUsage();
    }
  });
</script>

{#snippet noteCard(note: NoteListItem)}
  <Card.Root class="ui:hover:bg-muted/40 h-full transition-colors">
    <Card.Header class="gap-2 pb-0">
      <div class="flex items-start justify-between gap-3">
        <Card.Title class="line-clamp-2 text-base leading-snug">{note.title}</Card.Title>
        <span class="ui:text-muted-foreground shrink-0 text-xs">{formatUpdatedAt(note.updatedAt)}</span>
      </div>

      {#if note.ownerId !== $profile.id && note.ownerFullname}
        <Card.Description class="text-xs">
          {$t('notes.list.by_author', { name: note.ownerFullname })}
        </Card.Description>
      {/if}
    </Card.Header>

    <Card.Content class="pt-0">
      <p class="ui:text-muted-foreground line-clamp-4 text-sm leading-relaxed">
        {note.plainText || $t('notes.list.no_content')}
      </p>
    </Card.Content>

    <Card.Footer class="mt-auto flex flex-wrap gap-2 border-t-0 pt-0">
      {#if note.visibility === 'team' && note.ownerId !== $profile.id}
        <Badge variant="secondary">{$t('notes.list.shared_with_team')}</Badge>
      {/if}

      {#if note.origin === 'lesson_capture' && note.courseTitle}
        <Badge variant="secondary">{note.courseTitle}</Badge>
      {/if}

      {#if note.origin === 'lesson_capture' && note.lessonTitle}
        <Badge variant="outline">{note.lessonTitle}</Badge>
      {/if}

      {#each note.tags ?? [] as tag (tag.id)}
        <Badge variant="outline">
          <span
            class="mr-1 inline-block h-2 w-2 rounded-full border"
            style={`background-color: ${tag.color}`}
            aria-hidden="true"
          ></span>
          {tag.name}
        </Badge>
      {/each}
    </Card.Footer>
  </Card.Root>
{/snippet}

<div class="flex flex-col gap-4">
  {#if showWorkspaceUsage && notesApi.usage?.limit !== null && notesApi.usage}
    <p class="ui:text-muted-foreground text-sm">
      {$t('notes.usage.workspace', {
        used: notesApi.usage.used,
        limit: notesApi.usage.limit
      })}
    </p>
  {/if}

  {#if showSearch}
    <Page.BodyHeader align="right" class="p-0!">
      <Search placeholder={$t('notes.list.search')} bind:value={searchValue} />
    </Page.BodyHeader>
  {/if}

  <UnderlineTabs.Root bind:value={currentTab}>
    <UnderlineTabs.List>
      <UnderlineTabs.Trigger value="all">{$t('notes.list.tabs.all')}</UnderlineTabs.Trigger>
      {#if showTeamTab}
        <UnderlineTabs.Trigger value="team">{$t('notes.list.tabs.team')}</UnderlineTabs.Trigger>
      {/if}
      <UnderlineTabs.Trigger value="lessons">{$t('notes.list.tabs.from_lessons')}</UnderlineTabs.Trigger>
    </UnderlineTabs.List>
  </UnderlineTabs.Root>

  {#if showTemplatesSection}
    <NoteTemplatesRow {noteHref} />
  {/if}

  {#if notesApi.isLoading}
    <div class="flex justify-center py-12">
      <Spinner />
    </div>
  {:else if filteredNotes.length === 0}
    <Empty title={$t('notes.list.empty_title')} description={$t('notes.list.empty_description')} />
  {:else}
    <ul class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {#each filteredNotes as note (note.id)}
        <li class="min-h-[180px]">
          {#if noteHref}
            <a href={noteHref(note.id)} class="block h-full">
              {@render noteCard(note)}
            </a>
          {:else}
            {@render noteCard(note)}
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>
