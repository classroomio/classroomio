<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { Separator } from '@cio/ui/base/separator';
  import { ContentIcon, HoverableItem, PremiumIcon } from '@cio/ui/custom/moving-icons';
  import { sendPromptToAssistant } from '$features/ai-assistant/utils/store';
  import { t } from '$lib/utils/functions/translations';
  import { buildLessonSummarizePrompt } from './utils/lesson-summarize-prompt';

  interface Props {
    showTranscript?: boolean;
    showSummarize?: boolean;
    showTopSeparator?: boolean;
    showBottomSeparator?: boolean;
    /** Match the note column (`max-w-2xl`) instead of the full video column. */
    alignWithNote?: boolean;
    lessonId?: string;
    onTranscript?: () => void;
  }

  let {
    showTranscript = false,
    showSummarize = false,
    showTopSeparator = true,
    showBottomSeparator = true,
    alignWithNote = false,
    lessonId = '',
    onTranscript = () => {}
  }: Props = $props();

  function handleSummarizeLesson() {
    sendPromptToAssistant(buildLessonSummarizePrompt(lessonId));
  }
</script>

{#if showTranscript || showSummarize}
  <div class={alignWithNote ? 'mx-auto w-full max-w-2xl' : 'w-full'}>
    {#if showTopSeparator}
      <Separator class="my-3 sm:my-4" />
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
    </div>

    {#if showBottomSeparator}
      <Separator class="my-3 sm:my-4" />
    {/if}
  </div>
{/if}
