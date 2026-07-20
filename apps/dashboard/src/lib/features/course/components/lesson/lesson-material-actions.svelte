<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { Separator } from '@cio/ui/base/separator';
  import { ContentIcon, HoverableItem, PremiumIcon } from '@cio/ui/custom/moving-icons';
  import { sendPromptToAssistant } from '$features/ai-assistant/utils/store';
  import { t } from '$lib/utils/functions/translations';
  import { buildLessonSummarizePrompt } from './utils/lesson-summarize-prompt';
  import { sidePanel } from '$features/side-panel';
  import { LESSON_NOTE_PANEL_ID, openLessonNotePanel } from '$features/docs/utils/open-lesson-note';
  import NotebookPenIcon from '@lucide/svelte/icons/notebook-pen';

  interface Props {
    showTranscript?: boolean;
    showSummarize?: boolean;
    showTakeNote?: boolean;
    showTopSeparator?: boolean;
    showBottomSeparator?: boolean;
    /** Match the note column (`max-w-2xl`) instead of the full video column. */
    alignWithNote?: boolean;
    courseId?: string;
    lessonId: string;
    onTranscript?: () => void;
  }

  let {
    showTranscript = false,
    showSummarize = false,
    showTakeNote = false,
    showTopSeparator = true,
    showBottomSeparator = true,
    alignWithNote = false,
    courseId,
    lessonId,
    onTranscript = () => {}
  }: Props = $props();

  const isNotePanelOpen = $derived(sidePanel.activePanelId === LESSON_NOTE_PANEL_ID);

  function handleSummarizeLesson() {
    sendPromptToAssistant(buildLessonSummarizePrompt(lessonId));
  }

  function handleTakeNote() {
    if (!courseId) return;
    openLessonNotePanel({ courseId, lessonId });
  }
</script>

{#if showTranscript || showSummarize || (showTakeNote && courseId)}
  <div class={alignWithNote ? 'mx-auto w-full max-w-2xl' : 'w-full'}>
    {#if showTopSeparator}
      <Separator class="my-2" />
    {/if}

    <div class="flex flex-wrap items-center gap-x-2 gap-y-2 py-1 sm:gap-x-3">
      {#if showTranscript}
        <HoverableItem>
          {#snippet children(isHovered)}
            <Button variant="ghost" size="sm" class="ui:h-auto ui:px-1 ui:py-1 sm:ui:px-2" onclick={onTranscript}>
              <ContentIcon {isHovered} size={16} />
              {$t('course.navItem.lessons.materials.show_transcript')}
            </Button>
          {/snippet}
        </HoverableItem>
      {/if}

      {#if showTranscript && showSummarize}
        <span class="ui:text-muted-foreground hidden text-sm sm:inline" aria-hidden="true">|</span>
      {/if}

      {#if showSummarize}
        <HoverableItem>
          {#snippet children(isHovered)}
            <Button
              variant="ghost"
              size="sm"
              class="ui:h-auto ui:px-1 ui:py-1 sm:ui:px-2"
              onclick={handleSummarizeLesson}
            >
              <PremiumIcon {isHovered} size={16} />
              {$t('course.navItem.lessons.materials.summarize_lesson')}
            </Button>
          {/snippet}
        </HoverableItem>
      {/if}

      {#if showSummarize && showTakeNote && courseId}
        <span class="ui:text-muted-foreground hidden text-sm sm:inline" aria-hidden="true">|</span>
      {/if}

      {#if showTakeNote && courseId}
        <HoverableItem>
          {#snippet children(isHovered)}
            <Button
              variant="ghost"
              size="sm"
              class="ui:h-auto ui:px-1 ui:py-1 sm:ui:px-2"
              onclick={handleTakeNote}
              aria-pressed={isNotePanelOpen}
            >
              <NotebookPenIcon
                size={16}
                class={isHovered ? 'text-primary' : 'text-muted-foreground'}
                aria-hidden="true"
              />
              {isNotePanelOpen ? $t('docs.take_note.close') : $t('docs.take_note.open')}
            </Button>
          {/snippet}
        </HoverableItem>
      {/if}
    </div>

    {#if showBottomSeparator}
      <Separator class="my-2" />
    {/if}
  </div>
{/if}
