<script lang="ts">
  import { createEventDispatcher, onMount, untrack } from 'svelte';
  import { replaceState } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { courseApi, lessonApi } from '$features/course/api';
  import {
    getRelativeDayLabelKey,
    groupVersionsByDay,
    hasVersionSessionSpan
  } from '$features/course/utils/lesson-version-utils';
  import { renderHtmlDiff } from '$features/course/utils/lesson-version-diff';
  import { snackbar } from '$features/ui/snackbar/store';
  import { locale, t } from '$lib/utils/functions/translations';

  import type { LessonVersionEntry } from '$features/course/utils/types';
  import type { TLocale } from '@cio/db/types';

  interface Props {
    open?: boolean;
  }

  let { open = false }: Props = $props();

  const PAGE_SIZE = 10;
  const VERSION_PARAM = 'version';

  let lessonHistory = $state<LessonVersionEntry[]>([]);
  let selectedVersion = $state<LessonVersionEntry | null>(null);
  let selectedVersionIndex = $state(0);
  let contentRestoreLoading = $state(false);
  let lessonRevisionLoading = $state(false);
  let isConfirmingLessonRestore = $state(false);
  let isHistoryLoading = $state(false);
  let displayElement = $state<HTMLDivElement | null>(null);
  let nextCursor = $state<string | null>(null);
  let requestedVersionToken: string | null = null;
  /**
   * Bumped on every reload so an in-flight request for a previous lesson or locale cannot
   * write its rows over the current ones when it lands late.
   */
  let historyRequestId = 0;

  /** Only offer "load more" once the server has said there is a next page. */
  const canLoadMore = $derived(nextCursor !== null);

  const lessonId = $derived(lessonApi.lesson?.id ?? '');
  const lessonTitle = $derived(lessonApi.lesson?.title ?? '');
  const versionsByDay = $derived(groupVersionsByDay(lessonHistory));
  const currentVersionKeys = $derived(findCurrentVersionKeys(lessonHistory));
  const isSelectedVersionCurrent = $derived(
    selectedVersion ? currentVersionKeys.has(versionKey(selectedVersion)) : true
  );
  const isSelectedStructure = $derived(selectedVersion?.entryType === 'structure');
  const selectedChanges = $derived(selectedVersion?.changes ?? []);
  const dispatch = createEventDispatcher();

  onMount(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  });

  // Dates follow the dashboard locale; a hardcoded `en-US` gave Danish and
  // German readers English weekday names and a 12-hour clock. `hour12` is left
  // to the locale for the same reason.
  const dateLocale = $derived($locale || 'en');

  function formatTimestamp(timestamp: Date) {
    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    };

    return new Intl.DateTimeFormat(dateLocale, options).format(timestamp);
  }

  function formatTime(timestamp: Date) {
    return new Intl.DateTimeFormat(dateLocale, { hour: 'numeric', minute: 'numeric' }).format(timestamp);
  }

  function formatDayHeading(dayKey: number) {
    const relativeKey = getRelativeDayLabelKey(dayKey);
    if (relativeKey) {
      return t.get(`course.navItem.lessons.version_history.${relativeKey}`);
    }

    return new Intl.DateTimeFormat(dateLocale, {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    }).format(new Date(dayKey));
  }

  /**
   * One entry is an editing session, so it reads as a time range once it spans
   * more than a moment. A single-save session just shows its time.
   */
  function formatVersionLabel(version: LessonVersionEntry) {
    if (version.label) return version.label;
    if (!hasVersionSessionSpan(version)) return formatTime(version.timestamp);

    return `${formatTime(version.sessionStartedAt)} – ${formatTime(version.timestamp)}`;
  }

  function versionKey(version: LessonVersionEntry) {
    return `${version.entryType}:${version.blockId}:${version.id}`;
  }

  /** History is newest first, so the first entry seen for each block is that block's current text. */
  function findCurrentVersionKeys(versions: LessonVersionEntry[]) {
    const seenBlockIds = new Set<string>();
    const keys = new Set<string>();

    for (const version of versions) {
      if (version.entryType !== 'text' || !version.blockId) continue;
      if (seenBlockIds.has(version.blockId)) continue;

      seenBlockIds.add(version.blockId);
      keys.add(versionKey(version));
    }

    return keys;
  }

  function formatBlockLabel(version: LessonVersionEntry) {
    if (version.entryType !== 'text') return '';
    if (version.blockRemoved) return t.get('course.navItem.lessons.version_history.removed_block_label');
    if (version.blockCount <= 1 || version.blockNumber === null) return '';

    return t.get('course.navItem.lessons.version_history.block_label', {
      number: version.blockNumber,
      count: version.blockCount
    });
  }

  function formatChange(item: NonNullable<LessonVersionEntry['changes']>[number]) {
    const name = item.label ?? t.get(`course.navItem.lessons.version_history.block_type.${item.type}`);

    return t.get(`course.navItem.lessons.version_history.change_${item.kind}`, { name });
  }

  function formatChangeList(version: LessonVersionEntry) {
    if (version.entryType !== 'structure') return '';

    return version.changes.map(formatChange).join(' · ');
  }

  function sourceBadgeLabel(version: LessonVersionEntry) {
    if (version.source === 'assistant') {
      return t.get('course.navItem.lessons.version_history.by_assistant');
    }

    if (version.source === 'restore') {
      return t.get('course.navItem.lessons.version_history.by_restore');
    }

    return null;
  }

  function handleDrawerClose() {
    // The parent owns closing and clears both params in one navigation.
    dispatch('close');
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleDrawerClose();
    }
  }

  /** Structure entries are prefixed so their ids cannot collide with text entry ids in the URL. */
  function versionToken(version: LessonVersionEntry): string | null {
    if (!version.id) return null;

    return version.entryType === 'structure' ? `s${version.id}` : String(version.id);
  }

  function readVersionTokenFromUrl(): string | null {
    return page.url.searchParams.get(VERSION_PARAM);
  }

  /**
   * Mirrors the open version into the URL so a reload reopens on the same entry.
   * `replaceState` because picking through versions is browsing, not navigation — each
   * click should not cost a Back press.
   */
  function syncVersionToUrl(token: string | null) {
    const url = new URL(page.url);

    if (token === null) {
      url.searchParams.delete(VERSION_PARAM);
    } else {
      url.searchParams.set(VERSION_PARAM, token);
    }

    if (url.search === page.url.search) return;

    replaceState(resolve(`${url.pathname}${url.search}${url.hash}`, {}), page.state);
  }

  function selectContentVersion(version: LessonVersionEntry, index: number) {
    selectedVersionIndex = index;
    selectedVersion = version;
    isConfirmingLessonRestore = false;
  }

  function updateContentVersion(version: LessonVersionEntry, index: number) {
    requestedVersionToken = null;
    selectContentVersion(version, index);
    syncVersionToUrl(versionToken(version));
  }

  function renderSelectedVersion(version: LessonVersionEntry) {
    if (!displayElement) return;

    // Content is sanitized server-side by `sanitizeOptionalHtml` before it is
    // ever stored, and the diff only rewraps existing markup.
    displayElement.innerHTML = renderHtmlDiff(version.oldContent, version.newContent);
  }

  /**
   * Loads one keyset page. `cursor` omitted starts over from the newest entry, so this
   * doubles as the reload path when the lesson or locale changes.
   */
  async function fetchLessonHistory(currentLessonId: string, locale: TLocale, cursor?: string) {
    if (!courseApi.course?.id || !currentLessonId) return;

    const requestId = historyRequestId;

    try {
      isHistoryLoading = true;
      const response = await lessonApi.getHistory(courseApi.course.id, currentLessonId, locale, PAGE_SIZE, cursor);

      // The lesson or locale changed while this was in flight; its rows belong to a list
      // the reader has already left.
      if (requestId !== historyRequestId) return;

      if (!response || !lessonApi.success || !response.data) {
        throw new Error('Failed to fetch lesson history');
      }

      const previousVersionToken = selectedVersion ? versionToken(selectedVersion) : null;
      const pageEntries = response.data.items.map((item) => {
        const timestamp = item.timestamp ? new Date(item.timestamp) : new Date();

        return {
          id: item.id ?? 0,
          entryType: item.entryType,
          oldContent: item.oldContent ?? '',
          newContent: item.newContent ?? '',
          kind: item.kind ?? 'auto',
          label: item.label ?? null,
          sessionStartedAt: item.sessionStartedAt ? new Date(item.sessionStartedAt) : timestamp,
          timestamp,
          editCount: item.editCount ?? 1,
          authorName: item.authorName ?? null,
          source: item.source,
          changeSetId: item.changeSetId ?? null,
          undoable: item.undoable,
          changes: item.changes,
          locale: (item.locale ?? locale) as TLocale,
          lessonId: item.lessonId,
          blockId: item.blockId ?? null,
          blockNumber: item.blockNumber ?? null,
          blockCount: item.blockCount,
          blockRemoved: item.blockRemoved,
          sharedWithOtherLessons: item.sharedWithOtherLessons
        };
      });

      // Append: earlier pages stay put, so paging never re-transfers what is on screen.
      lessonHistory = cursor ? [...lessonHistory, ...pageEntries] : pageEntries;
      nextCursor = response.data.nextCursor ?? null;

      // Keep searching appended pages for a deep-linked version. Until it is found,
      // the newest entry is only a visual fallback and must not replace the requested ID.
      const targetVersionToken = requestedVersionToken ?? previousVersionToken;
      const targetIndex = targetVersionToken
        ? lessonHistory.findIndex((version) => versionToken(version) === targetVersionToken)
        : -1;

      if (targetIndex >= 0) {
        updateContentVersion(lessonHistory[targetIndex], targetIndex);
        return;
      }

      // A deep-linked version deeper than the loaded pages cannot be resolved yet; fall
      // back to newest rather than leaving the panel blank.
      if (!cursor && lessonHistory[0]) {
        if (requestedVersionToken === null) {
          updateContentVersion(lessonHistory[0], 0);
        } else {
          selectContentVersion(lessonHistory[0], 0);
        }
      }
    } catch (error) {
      if (requestId !== historyRequestId) return;

      console.error(error);
      snackbar.error('Failed to fetch history');
    } finally {
      if (requestId === historyRequestId) {
        isHistoryLoading = false;
      }
    }
  }

  async function restoreSelectedVersion() {
    if (selectedVersion?.entryType !== 'text' || !selectedVersion.blockId || !courseApi.course?.id) return;

    try {
      contentRestoreLoading = true;
      await lessonApi.restoreHistoryVersion(courseApi.course.id, selectedVersion.lessonId, {
        blockId: selectedVersion.blockId,
        locale: selectedVersion.locale,
        versionId: selectedVersion.id
      });

      if (lessonApi.success) {
        dispatch('restore');
      }
    } catch (error) {
      console.error(error);
      snackbar.error('Failed to restore');
    } finally {
      contentRestoreLoading = false;
    }
  }

  async function restoreLessonFromSelected() {
    if (!selectedVersion || !courseApi.course?.id) return;

    try {
      lessonRevisionLoading = true;
      await lessonApi.restoreLessonToEntry(courseApi.course.id, selectedVersion.lessonId, {
        entryType: selectedVersion.entryType,
        entryId: selectedVersion.id
      });

      if (lessonApi.success) {
        dispatch('restore');
      }
    } finally {
      lessonRevisionLoading = false;
      isConfirmingLessonRestore = false;
    }
  }

  async function undoSelectedChangeSet() {
    if (!selectedVersion?.changeSetId || !courseApi.course?.id) return;

    try {
      lessonRevisionLoading = true;
      await lessonApi.undoChangeSet(courseApi.course.id, selectedVersion.lessonId, selectedVersion.changeSetId);

      if (lessonApi.success) {
        dispatch('restore');
      }
    } finally {
      lessonRevisionLoading = false;
    }
  }

  function loadMoreHistory() {
    if (!nextCursor || isHistoryLoading) return;

    void fetchLessonHistory(lessonId, lessonApi.currentLocale, nextCursor);
  }

  // Reload from the newest page whenever the lesson or locale changes. Paging is driven by
  // the button instead, so the cursor is deliberately not a dependency here.
  $effect(() => {
    const currentLessonId = lessonId;
    const currentLocale = lessonApi.currentLocale;

    untrack(() => {
      historyRequestId += 1;
      lessonHistory = [];
      nextCursor = null;
      selectedVersion = null;
      selectedVersionIndex = 0;
      requestedVersionToken = readVersionTokenFromUrl();
      void fetchLessonHistory(currentLessonId, currentLocale);
    });
  });

  $effect(() => {
    const version = selectedVersion;
    const element = displayElement;

    if (!version || !element) return;

    untrack(() => renderSelectedVersion(version));
  });
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <aside
    class="ui:bg-background fixed inset-0 z-250 flex h-screen w-screen overflow-hidden"
    role="dialog"
    aria-modal="true"
    aria-labelledby="lesson-version-history-title"
  >
    <div class="flex min-w-0 flex-1 flex-col">
      <header class="ui:border-border ui:bg-background flex h-16 shrink-0 items-center justify-between border-b px-5">
        <div class="flex min-w-0 items-center gap-3">
          <IconButton onclick={handleDrawerClose} aria-label={$t('common.back')} tooltip={$t('common.back')}>
            <ArrowLeftIcon size={18} />
          </IconButton>
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold">
              {selectedVersion ? formatTimestamp(selectedVersion.timestamp) : lessonTitle}
            </p>
            {#if selectedVersion}
              <p class="ui:text-muted-foreground truncate text-xs">
                {[lessonTitle, formatBlockLabel(selectedVersion)].filter(Boolean).join(' · ')}
              </p>
            {/if}
          </div>
        </div>

        {#if selectedVersion && isConfirmingLessonRestore}
          <div class="flex items-center gap-2">
            <span class="ui:text-muted-foreground text-sm">
              {$t('course.navItem.lessons.version_history.restore_lesson_confirm')}
            </span>
            <Button variant="outline" size="sm" onclick={() => (isConfirmingLessonRestore = false)}>
              {$t('common.cancel')}
            </Button>
            <Button size="sm" loading={lessonRevisionLoading} onclick={restoreLessonFromSelected}>
              {$t('course.navItem.lessons.version_history.restore_lesson')}
            </Button>
          </div>
        {:else if selectedVersion && selectedVersion.id > 0}
          <div class="flex items-center gap-2">
            {#if selectedVersion.undoable}
              <Button variant="outline" size="sm" loading={lessonRevisionLoading} onclick={undoSelectedChangeSet}>
                {$t('course.navItem.lessons.version_history.undo_change')}
              </Button>
            {/if}
            {#if selectedVersion.entryType === 'text' && !isSelectedVersionCurrent && !selectedVersion.blockRemoved}
              <Button variant="secondary" size="sm" loading={contentRestoreLoading} onclick={restoreSelectedVersion}>
                {$t('course.navItem.lessons.version_history.restore_version')}
              </Button>
            {/if}
            {#if selectedVersionIndex !== 0}
              <Button variant="secondary" size="sm" onclick={() => (isConfirmingLessonRestore = true)}>
                {$t('course.navItem.lessons.version_history.restore_lesson')}
              </Button>
            {/if}
          </div>
        {/if}
      </header>

      <main class="ui:bg-muted/40 flex-1 overflow-y-auto p-8 lg:p-12">
        <article
          class="ui:border-border ui:bg-background mx-auto min-h-full w-full max-w-4xl border px-10 py-12 shadow-sm lg:px-16"
        >
          {#if selectedVersion && !isSelectedVersionCurrent && selectedVersion.entryType === 'text' && selectedVersion.sharedWithOtherLessons > 0}
            <p class="ui:bg-muted ui:text-muted-foreground mb-6 rounded-md px-4 py-3 text-sm">
              {$t('course.navItem.lessons.version_history.shared_restore_hint')}
            </p>
          {/if}
          <h1 class="mb-10 text-3xl font-semibold capitalize">{lessonTitle}</h1>

          {#if isSelectedStructure}
            <ul class="ui:border-border space-y-2 divide-y">
              {#each selectedChanges as change (change.blockId + change.kind)}
                <li class="flex items-center justify-between gap-4 py-2 text-sm">
                  <span class="flex min-w-0 items-center gap-2">
                    <Badge variant="secondary">
                      {$t(`course.navItem.lessons.version_history.change_kind.${change.kind}`)}
                    </Badge>
                    <span class="min-w-0 truncate">
                      {change.label ?? $t(`course.navItem.lessons.version_history.block_type.${change.type}`)}
                    </span>
                  </span>
                </li>
              {:else}
                <li class="ui:text-muted-foreground py-2 text-sm">
                  {$t('course.navItem.lessons.version_history.structure_state')}
                </li>
              {/each}
            </ul>
          {/if}

          {#if !isSelectedStructure}
            <div bind:this={displayElement} class="lesson-version-content"></div>
          {/if}
        </article>
      </main>
    </div>

    <div class="ui:border-border ui:bg-muted/30 flex w-88 shrink-0 flex-col border-l">
      <div class="ui:border-border flex h-16 shrink-0 items-center border-b px-5">
        <h2 id="lesson-version-history-title" class="text-base font-semibold">
          {$t('course.navItem.lessons.version_history.title')}
        </h2>
      </div>

      <div class="flex-1 overflow-y-auto px-3 py-4">
        {#if lessonHistory.length === 0 && !isHistoryLoading}
          <p class="ui:text-muted-foreground px-3 py-6 text-center text-sm">
            {$t('course.navItem.lessons.version_history.empty')}
          </p>
        {/if}

        {#each versionsByDay as day (day.dayKey)}
          <section class="mb-4">
            <h3 class="ui:text-muted-foreground px-3 pb-1 text-xs font-semibold tracking-wide uppercase">
              {formatDayHeading(day.dayKey)}
            </h3>

            <div class="space-y-1">
              {#each day.versions as version (versionKey(version))}
                {@const index = lessonHistory.indexOf(version)}
                <Button
                  onclick={() => updateContentVersion(version, index)}
                  variant={index === selectedVersionIndex ? 'secondary' : 'ghost'}
                  class="h-full w-full text-left"
                >
                  <ChevronRightIcon class="mt-0.5 shrink-0" size={16} />
                  <span class="min-w-0 flex-1">
                    <span class="flex items-center gap-2">
                      <span class="truncate text-sm font-medium">{formatVersionLabel(version)}</span>
                      {#if version.entryType === 'structure'}
                        <Badge variant="secondary">
                          {$t('course.navItem.lessons.version_history.structure_change')}
                        </Badge>
                      {:else if version.kind !== 'auto'}
                        <Badge variant={version.kind === 'publish' ? 'default' : 'secondary'}>
                          {$t(`course.navItem.lessons.version_history.kind.${version.kind}`)}
                        </Badge>
                      {/if}
                      {#if sourceBadgeLabel(version)}
                        <Badge variant="secondary">{sourceBadgeLabel(version)}</Badge>
                      {/if}
                    </span>

                    {#if formatBlockLabel(version)}
                      <span class="ui:text-muted-foreground mt-0.5 block text-xs">{formatBlockLabel(version)}</span>
                    {:else if version.entryType === 'structure' && (version.changes ?? []).length > 0}
                      <span class="ui:text-muted-foreground mt-0.5 block truncate text-xs">
                        {formatChangeList(version)}
                      </span>
                    {/if}

                    {#if currentVersionKeys.has(versionKey(version))}
                      <span class="ui:text-muted-foreground mt-0.5 block text-xs">
                        {$t('course.navItem.lessons.version_history.current_version')}
                      </span>
                    {/if}

                    <span class="ui:text-muted-foreground mt-0.5 block truncate text-xs">
                      {#if version.authorName}
                        {$t('course.navItem.lessons.version_history.by_author', { name: version.authorName })}
                      {/if}
                      {#if version.editCount > 1}
                        · {$t('course.navItem.lessons.version_history.edit_count', { count: version.editCount })}
                      {/if}
                    </span>
                  </span>
                </Button>
              {/each}
            </div>
          </section>
        {/each}
      </div>

      {#if canLoadMore}
        <div class="ui:border-border shrink-0 border-t p-4">
          <Button class="w-full" variant="outline" loading={isHistoryLoading} onclick={loadMoreHistory}>
            {$t('course.navItem.lessons.version_history.fetch_more_versions')}
          </Button>
        </div>
      {/if}
    </div>
  </aside>
{/if}

<style>
  :global(.lesson-version-content) {
    line-height: 1.7;
  }

  /* Markers are inline now, so they must not disturb the surrounding line. */
  :global(.lesson-version-content .version-added) {
    background: color-mix(in srgb, #14b8a6 16%, transparent);
    color: #0f766e;
    text-decoration: none;
    border-radius: 2px;
  }

  :global(.lesson-version-content .version-removed) {
    background: color-mix(in srgb, #ef4444 12%, transparent);
    color: #b91c1c;
    text-decoration: line-through;
    border-radius: 2px;
  }

  :global(.dark .lesson-version-content .version-added) {
    color: #5eead4;
  }

  :global(.dark .lesson-version-content .version-removed) {
    color: #fca5a5;
  }
</style>
