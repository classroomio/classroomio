<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { Separator } from '@cio/ui/base/separator';
  import { ContentIcon, HoverableItem } from '@cio/ui/custom/moving-icons';
  import { t } from '$lib/utils/functions/translations';
  import LessonSummarizeButton from './lesson-summarize-button.svelte';

  interface Props {
    showTranscript?: boolean;
    showSummarize?: boolean;
    lessonId?: string;
    onTranscript?: () => void;
  }

  let { showTranscript = false, showSummarize = false, lessonId = '', onTranscript = () => {} }: Props = $props();
</script>

{#if showTranscript || showSummarize}
  <Separator class="my-4" />

  <div class="flex flex-wrap items-center gap-x-3 gap-y-2 py-1">
    {#if showTranscript}
      <HoverableItem>
        {#snippet children(isHovered)}
          <Button variant="ghost" size="sm" class="ui:px-2" onclick={onTranscript}>
            <ContentIcon {isHovered} size={16} />
            {$t('course.navItem.lessons.materials.show_transcript')}
          </Button>
        {/snippet}
      </HoverableItem>
    {/if}

    {#if showTranscript && showSummarize}
      <span class="ui:text-muted-foreground text-sm" aria-hidden="true">|</span>
    {/if}

    {#if showSummarize}
      <LessonSummarizeButton {lessonId} />
    {/if}
  </div>

  <Separator class="my-4" />
{/if}
