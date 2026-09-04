<script lang="ts">
  import { createEventDispatcher, onMount, untrack } from 'svelte';
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

  let lessonHistory = $state<LessonVersionEntry[]>([]);
  let selectedVersion = $state<LessonVersionEntry | null>(null);
  let selectedVersionIndex = $state(0);
  let contentRestoreLoading = $state(false);
  let versionsToFetch = $state(9);
  let isHistoryLoading = $state(false);
  let displayElement = $state<HTMLDivElement | null>(null);

  const lessonId = $derived(lessonApi.lesson?.id ?? '');
  const lessonTitle = $derived(lessonApi.lesson?.title ?? '');
  const versionsByDay = $derived(groupVersionsByDay(lessonHistory));
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

  function handleDrawerClose() {
    dispatch('close');
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleDrawerClose();
    }
  }

  function updateContentVersion(version: LessonVersionEntry, index: number) {
    selectedVersionIndex = index;
    selectedVersion = version;
  }

  function renderSelectedVersion(version: LessonVersionEntry) {
    if (!displayElement) return;

    // Content is sanitized server-side by `sanitizeOptionalHtml` before it is
    // ever stored, and the diff only rewraps existing markup.
    displayElement.innerHTML = renderHtmlDiff(version.oldContent, version.newContent);
  }

  async function fetchLessonHistory(currentLessonId: string, locale: TLocale, endRange: number) {
    if (!courseApi.course?.id || !currentLessonId) return;

    try {
      isHistoryLoading = true;
      const response = await lessonApi.getHistory(courseApi.course.id, currentLessonId, locale, endRange);

      if (!response || !lessonApi.success || !response.data) {
        throw new Error('Failed to fetch lesson history');
      }

      const previousVersionId = selectedVersion?.id;
      lessonHistory = response.data.map((item) => {
        const timestamp = item.timestamp ? new Date(item.timestamp) : new Date();

        return {
          id: item.id ?? 0,
          oldContent: item.oldContent ?? '',
          newContent: item.newContent ?? '',
          kind: item.kind ?? 'auto',
          label: item.label ?? null,
          sessionStartedAt: item.sessionStartedAt ? new Date(item.sessionStartedAt) : timestamp,
          timestamp,
          editCount: item.editCount ?? 1,
          authorName: item.authorName ?? null,
          locale: (item.locale as TLocale) ?? 'en',
          lessonId: item.lessonId ?? ''
        };
      });

      const previousIndex = previousVersionId
        ? lessonHistory.findIndex((version) => version.id === previousVersionId)
        : -1;
      const nextIndex = previousIndex >= 0 ? previousIndex : 0;
      const nextVersion = lessonHistory[nextIndex];

      if (nextVersion) {
        updateContentVersion(nextVersion, nextIndex);
      }
    } catch (error) {
      console.error(error);
      snackbar.error('Failed to fetch history');
    } finally {
      isHistoryLoading = false;
    }
  }

  async function restoreSelectedVersion() {
    if (!courseApi.course?.id || !selectedVersion) return;

    try {
      contentRestoreLoading = true;
      await lessonApi.upsertLanguage(
        courseApi.course.id,
        selectedVersion.lessonId,
        selectedVersion.locale,
        selectedVersion.newContent,
        // Restoring is a deliberate checkpoint, not an autosave: it must not fold
        // into whatever session the author had open.
        'manual'
      );
      dispatch('restore');
    } catch (error) {
      console.error(error);
      snackbar.error('Failed to restore');
    } finally {
      contentRestoreLoading = false;
    }
  }

  function loadMoreHistory() {
    versionsToFetch += 10;
  }

  $effect(() => {
    const currentLessonId = lessonId;
    const currentLocale = lessonApi.currentLocale;
    const endRange = versionsToFetch;

    untrack(() => {
      void fetchLessonHistory(currentLessonId, currentLocale, endRange);
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
          <IconButton
            onclick={handleDrawerClose}
            aria-label={$t('course.navItem.lessons.poll.back')}
            tooltip={$t('course.navItem.lessons.poll.back')}
          >
            <ArrowLeftIcon size={18} />
          </IconButton>
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold">
              {selectedVersion ? formatTimestamp(selectedVersion.timestamp) : lessonTitle}
            </p>
            {#if selectedVersion}
              <p class="ui:text-muted-foreground truncate text-xs">{lessonTitle}</p>
            {/if}
          </div>
        </div>

        {#if selectedVersionIndex !== 0 && selectedVersion}
          <Button loading={contentRestoreLoading} onclick={restoreSelectedVersion}>
            {$t('course.navItem.lessons.version_history.restore_version')}
          </Button>
        {/if}
      </header>

      <main class="ui:bg-muted/40 flex-1 overflow-y-auto p-8 lg:p-12">
        <article
          class="ui:border-border ui:bg-background mx-auto min-h-full w-full max-w-4xl border px-10 py-12 shadow-sm lg:px-16"
        >
          <h1 class="mb-10 text-3xl font-semibold capitalize">{lessonTitle}</h1>
          <div bind:this={displayElement} class="lesson-version-content"></div>
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
              {#each day.versions as version (version.id)}
                {@const index = lessonHistory.indexOf(version)}
                <button
                  type="button"
                  onclick={() => updateContentVersion(version, index)}
                  class="ui:hover:bg-accent flex w-full items-start gap-2 rounded-lg px-3 py-3 text-left transition-colors {index ===
                  selectedVersionIndex
                    ? 'ui:bg-accent'
                    : ''}"
                >
                  <ChevronRightIcon class="mt-0.5 shrink-0" size={16} />
                  <span class="min-w-0 flex-1">
                    <span class="flex items-center gap-2">
                      <span class="truncate text-sm font-medium">{formatVersionLabel(version)}</span>
                      {#if version.kind !== 'auto'}
                        <Badge variant={version.kind === 'publish' ? 'success' : 'secondary'}>
                          {$t(`course.navItem.lessons.version_history.kind.${version.kind}`)}
                        </Badge>
                      {/if}
                    </span>

                    {#if index === 0}
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
                </button>
              {/each}
            </div>
          </section>
        {/each}
      </div>

      <div class="ui:border-border shrink-0 border-t p-4">
        <Button class="w-full" variant="outline" loading={isHistoryLoading} onclick={loadMoreHistory}>
          {$t('course.navItem.lessons.version_history.fetch_more_versions')}
        </Button>
      </div>
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
