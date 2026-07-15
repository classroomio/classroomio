<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { HoverableItem, PremiumIcon } from '@cio/ui/custom/moving-icons';
  import { sendPromptToAssistant } from '$features/ai-assistant/utils/store';
  import { t } from '$lib/utils/functions/translations';
  import { buildLessonSummarizePrompt } from './utils/lesson-summarize-prompt';

  interface Props {
    lessonId: string;
    class?: string;
  }

  let { lessonId, class: className = '' }: Props = $props();

  function handleSummarizeLesson() {
    sendPromptToAssistant(buildLessonSummarizePrompt(lessonId));
  }
</script>

<HoverableItem>
  {#snippet children(isHovered)}
    <Button variant="ghost" size="sm" class="ui:px-2 {className}" onclick={handleSummarizeLesson}>
      <PremiumIcon {isHovered} size={16} />
      {$t('course.navItem.lessons.materials.summarize_lesson')}
    </Button>
  {/snippet}
</HoverableItem>
