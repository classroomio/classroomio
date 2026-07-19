<script lang="ts">
  import SparklesIcon from '@lucide/svelte/icons/sparkles';
  import XIcon from '@lucide/svelte/icons/x';
  import { Button } from '@cio/ui/base/button';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { Empty } from '@cio/ui/custom/empty';
  import { sidePanel } from '$features/side-panel';
  import { snackbar } from '$features/ui/snackbar/store';
  import { t } from '$lib/utils/functions/translations';
  import { noteCommentsApi } from '../api';
  import { openNoteCommentsPanel } from '../panel';

  interface Props {
    noteId?: string;
    noteTitle?: string;
    getNoteContent?: () => string;
    getSelectedText?: () => string;
    onReviewComplete?: (content: string) => void;
    onPanelClose?: () => void;
  }

  let { noteId, noteTitle, getNoteContent, getSelectedText, onReviewComplete, onPanelClose }: Props = $props();

  let isReviewing = $state(false);
  let lastCreatedCount = $state<number | null>(null);

  async function runReview(focusQuotedText?: string) {
    if (!noteId || !getNoteContent) {
      return;
    }

    const content = getNoteContent().trim();

    if (!content) {
      snackbar.error('notes.ai_panel.empty_note_error');
      return;
    }

    isReviewing = true;
    lastCreatedCount = null;

    const result = await noteCommentsApi.reviewWithAi(noteId, {
      content,
      ...(focusQuotedText?.trim() ? { focusQuotedText: focusQuotedText.trim() } : {})
    });

    isReviewing = false;

    if (!result) {
      snackbar.error('notes.ai_panel.review_error');
      return;
    }

    lastCreatedCount = result.createdCount;
    onReviewComplete?.(result.content);

    if (result.createdCount === 0) {
      snackbar.success('notes.ai_panel.review_empty');
      return;
    }

    snackbar.success('notes.ai_panel.review_success');
    openNoteCommentsPanel();
  }

  async function handleReviewNote() {
    await runReview();
  }

  async function handleReviewSelection() {
    const selectedText = getSelectedText?.()?.trim() ?? '';

    if (!selectedText) {
      snackbar.error('notes.ai_panel.selection_required');
      return;
    }

    await runReview(selectedText);
  }
</script>

<header class="border-border flex items-center gap-2 border-b px-4 py-3">
  <SparklesIcon size={16} class="ui:text-primary shrink-0" />
  <div class="min-w-0 flex-1">
    <p class="truncate text-sm font-semibold">{$t('notes.ai_panel.title')}</p>
    {#if noteTitle}
      <p class="ui:text-muted-foreground truncate text-xs">{noteTitle}</p>
    {/if}
  </div>
  <IconButton
    variant="secondary"
    size="icon"
    onclick={() => {
      onPanelClose?.();
      sidePanel.close();
    }}
  >
    <XIcon size={16} />
  </IconButton>
</header>

<div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
  <Empty
    title={$t('notes.ai_panel.empty_title')}
    description={$t('notes.ai_panel.empty_description')}
    icon={SparklesIcon}
  />

  <div class="space-y-2">
    <Button class="w-full" loading={isReviewing} onclick={handleReviewNote} disabled={!noteId}>
      <SparklesIcon size={16} />
      {$t('notes.ai_panel.review_note')}
    </Button>
    <Button class="w-full" variant="secondary" loading={isReviewing} onclick={handleReviewSelection} disabled={!noteId}>
      {$t('notes.ai_panel.review_selection')}
    </Button>
    <p class="ui:text-muted-foreground text-xs">{$t('notes.ai_panel.review_hint')}</p>
  </div>

  {#if lastCreatedCount !== null}
    <p class="ui:text-muted-foreground text-center text-xs">
      {$t('notes.ai_panel.last_result', { count: lastCreatedCount })}
    </p>
  {/if}
</div>
