<script lang="ts">
  import HistoryIcon from '@lucide/svelte/icons/history';
  import LoaderIcon from '@lucide/svelte/icons/loader';
  import XIcon from '@lucide/svelte/icons/x';
  import { diffLines } from 'diff';
  import { Button } from '@cio/ui/base/button';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { SafeHtmlContent } from '@cio/ui/custom/safe-html-content';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import { docsApi } from '../api';
  import type { NoteVersionHistoryItem } from '../utils/types';

  interface Props {
    docId: string;
    open?: boolean;
    onClose?: () => void;
    onRestore?: (content: string) => void;
  }

  let { docId, open = false, onClose, onRestore }: Props = $props();

  let versions = $state<NoteVersionHistoryItem[]>([]);
  let selectedVersionIndex = $state(0);
  let endRange = $state(9);
  let isLoading = $state(false);
  let isRestoring = $state(false);

  const selectedVersion = $derived(versions[selectedVersionIndex]);

  function formatTimestamp(timestamp: string | Date) {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return new Intl.DateTimeFormat(undefined, {
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  }

  function htmlToPlainText(html: string) {
    if (!html) {
      return '';
    }

    if (typeof document === 'undefined') {
      return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    const doc = new DOMParser().parseFromString(html, 'text/html');

    return doc.body.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  }

  function buildPlainTextDiff(version: NoteVersionHistoryItem) {
    const oldText = htmlToPlainText(version.oldContent ?? '');
    const newText = htmlToPlainText(version.newContent ?? '');

    if (!oldText && !newText) {
      return [];
    }

    if (!oldText) {
      return [{ added: true, value: newText }];
    }

    return diffLines(oldText, newText);
  }

  async function loadVersionHistory() {
    isLoading = true;
    versions = await docsApi.getVersionHistory(docId, endRange);
    selectedVersionIndex = 0;
    isLoading = false;
  }

  async function restoreSelectedVersion() {
    if (!selectedVersion || selectedVersionIndex === 0) return;

    isRestoring = true;
    const restored = await docsApi.restoreVersion(docId, selectedVersion.id);
    isRestoring = false;

    if (!restored) {
      snackbar.error('docs.editor.version_history.restore_error');
      return;
    }

    snackbar.success('docs.editor.version_history.restore_success');
    onRestore?.(restored.content);
    onClose?.();
  }

  function loadMoreVersions() {
    endRange += 10;
  }

  $effect(() => {
    if (!open || !docId) return;

    endRange;

    void loadVersionHistory();
  });
</script>

{#if open}
  <div class="fixed inset-0 z-[120]">
    <button
      type="button"
      class="absolute inset-0 bg-black/40"
      aria-label={$t('docs.share.cancel')}
      onclick={() => onClose?.()}
    ></button>

    <aside
      class="ui:bg-background ui:border-border absolute inset-y-0 right-0 flex w-full max-w-5xl border-l shadow-xl"
    >
      <div class="ui:bg-background flex min-w-0 flex-1 flex-col overflow-hidden">
        <header class="ui:border-border flex items-center gap-2 border-b px-4 py-3">
          <IconButton variant="secondary" size="icon" onclick={() => onClose?.()}>
            <XIcon size={16} />
          </IconButton>

          <h2 class="text-sm font-semibold">{$t('docs.editor.version_history.title')}</h2>

          {#if selectedVersionIndex !== 0}
            <Button class="ml-auto" size="sm" loading={isRestoring} onclick={restoreSelectedVersion}>
              {$t('docs.editor.version_history.restore')}
            </Button>
          {/if}
        </header>

        <div class="min-h-0 flex-1 overflow-y-auto p-6">
          {#if isLoading}
            <div class="ui:text-muted-foreground flex h-40 items-center justify-center text-sm">
              <LoaderIcon size={18} class="mr-2 animate-spin" />
              {$t('docs.editor.version_history.loading')}
            </div>
          {:else if !selectedVersion}
            <p class="ui:text-muted-foreground text-sm">{$t('docs.editor.version_history.empty')}</p>
          {:else}
            <div class="ui:bg-card ui:border-border rounded-lg border p-4">
              <p class="ui:text-muted-foreground mb-3 text-xs font-medium uppercase">
                {$t('docs.editor.version_history.preview')}
              </p>
              <div class="prose dark:prose-invert max-w-none">
                <SafeHtmlContent content={selectedVersion.newContent ?? ''} />
              </div>
            </div>

            {#if selectedVersion.oldContent}
              <div class="ui:bg-muted/30 mt-6 rounded-lg p-4">
                <p class="ui:text-muted-foreground mb-3 text-xs font-medium uppercase">
                  {$t('docs.editor.version_history.changes')}
                </p>
                <div class="text-sm leading-relaxed whitespace-pre-wrap">
                  {#each buildPlainTextDiff(selectedVersion) as part, index (index)}
                    <span class={part.added ? 'text-green-600' : part.removed ? 'text-red-600 line-through' : ''}>
                      {part.value}
                    </span>
                  {/each}
                </div>
              </div>
            {/if}
          {/if}
        </div>
      </div>

      <div class="ui:border-border ui:bg-muted/30 w-80 shrink-0 overflow-y-auto border-l">
        <p class="flex items-center gap-2 px-4 py-4 text-sm font-medium">
          <HistoryIcon size={16} />
          {$t('docs.editor.version_history.versions')}
        </p>

        {#if isLoading}
          <div class="px-4 py-2">
            <LoaderIcon size={16} class="animate-spin" />
          </div>
        {:else}
          {#each versions as version, index (version.id)}
            <button
              type="button"
              onclick={() => {
                selectedVersionIndex = index;
              }}
              class="hover:ui:bg-muted flex w-full flex-col items-start px-4 py-3 text-left {index ===
              selectedVersionIndex
                ? 'ui:bg-muted'
                : ''}"
            >
              <span class="text-sm font-medium">{formatTimestamp(version.timestamp)}</span>
              {#if index === 0}
                <span class="ui:text-muted-foreground text-xs italic">
                  {$t('docs.editor.version_history.current')}
                </span>
              {/if}
            </button>
          {/each}

          <div class="px-4 py-3">
            <Button variant="secondary" size="sm" onclick={loadMoreVersions}>
              {$t('docs.editor.version_history.load_more')}
            </Button>
          </div>
        {/if}
      </div>
    </aside>
  </div>
{/if}
