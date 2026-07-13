<script lang="ts">
  import { Button } from '@cio/ui/base/button';
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

<Button variant="outline" size="sm" class={className} onclick={handleSummarizeLesson}>
  {$t('course.navItem.lessons.materials.summarize_lesson')}
</Button>
