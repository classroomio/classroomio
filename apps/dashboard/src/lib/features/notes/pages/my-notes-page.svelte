<script lang="ts">
  import * as UnderlineTabs from '@cio/ui/custom/underline-tabs';
  import { Badge } from '@cio/ui/base/badge';
  import { Search } from '@cio/ui/custom/search';
  import { Empty } from '@cio/ui/custom/empty';
  import { Spinner } from '@cio/ui/base/spinner';
  import { profile } from '$lib/utils/store/user';
  import { currentOrg } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import { notesApi } from '../api';

  interface Props {
    showWorkspaceUsage?: boolean;
  }

  let { showWorkspaceUsage = false }: Props = $props();

  let searchValue = $state('');
  let currentTab = $state<'all' | 'lessons'>('all');

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

    notesApi.listNotes();

    if (showWorkspaceUsage) {
      notesApi.fetchUsage();
    }
  });
</script>

<div class="flex flex-col gap-4">
  {#if showWorkspaceUsage && notesApi.usage?.limit !== null && notesApi.usage}
    <p class="ui:text-muted-foreground text-sm">
      {$t('notes.usage.workspace', {
        used: notesApi.usage.used,
        limit: notesApi.usage.limit
      })}
    </p>
  {/if}

  <Search placeholder={$t('notes.list.search')} bind:value={searchValue} />

  <UnderlineTabs.Root bind:value={currentTab}>
    <UnderlineTabs.List>
      <UnderlineTabs.Trigger value="all">{$t('notes.list.tabs.all')}</UnderlineTabs.Trigger>
      <UnderlineTabs.Trigger value="lessons">{$t('notes.list.tabs.from_lessons')}</UnderlineTabs.Trigger>
    </UnderlineTabs.List>
  </UnderlineTabs.Root>

  {#if notesApi.isLoading}
    <div class="flex justify-center py-12">
      <Spinner />
    </div>
  {:else if filteredNotes.length === 0}
    <Empty title={$t('notes.list.empty_title')} description={$t('notes.list.empty_description')} />
  {:else}
    <ul class="divide-border divide-y rounded-lg border">
      {#each filteredNotes as note (note.id)}
        <li class="flex flex-col gap-2 px-4 py-3">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="truncate font-medium">{note.title}</p>
              <p class="ui:text-muted-foreground line-clamp-2 text-sm">
                {note.plainText || $t('notes.list.no_content')}
              </p>
            </div>
            <span class="ui:text-muted-foreground shrink-0 text-xs">{formatUpdatedAt(note.updatedAt)}</span>
          </div>

          {#if note.origin === 'lesson_capture' && (note.courseTitle || note.lessonTitle)}
            <div class="flex flex-wrap gap-2">
              {#if note.courseTitle}
                <Badge variant="secondary">{note.courseTitle}</Badge>
              {/if}
              {#if note.lessonTitle}
                <Badge variant="outline">{note.lessonTitle}</Badge>
              {/if}
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>
