<script lang="ts">
  import { AIGeneratePopover } from '@cio/ui/custom/ai-generate-popover';
  import { textGenerationApi } from '../api/text-generation.svelte';

  interface Props {
    onInsert: (text: string) => void;
    context?: string;
    format?: 'plain' | 'html';
    courseId?: string;
    align?: 'start' | 'center' | 'end';
  }

  let { onInsert, context, format = 'plain', courseId, align = 'right' }: Props = $props();
</script>

<AIGeneratePopover
  {align}
  onGenerate={async (prompt, tone) => {
    const text = await textGenerationApi.generate(prompt, tone, format, context, courseId);
    if (text) onInsert(text);
  }}
/>
