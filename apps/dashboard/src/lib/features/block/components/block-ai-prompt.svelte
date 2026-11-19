<script lang="ts">
  import { tick } from 'svelte';
  import SparklesIcon from '@lucide/svelte/icons/sparkles';
  import XIcon from '@lucide/svelte/icons/x';
  import { Button } from '@cio/ui/base/button';
  import { Input } from '@cio/ui/base/input';
  import { t } from '$lib/utils/functions/translations';
  import { sendPromptToAssistant } from '$features/ai-assistant/utils/store';

  interface Props {
    open: boolean;
    onClose: () => void;
  }

  let { open, onClose }: Props = $props();

  let prompt = $state('');
  let input = $state<HTMLInputElement | null>(null);

  $effect(() => {
    if (!open) return;

    void tick().then(() => input?.focus());
  });

  function close() {
    prompt = '';
    onClose();
  }

  function submit() {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    close();
    sendPromptToAssistant(trimmed);
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key !== 'Escape') return;

    event.preventDefault();
    event.stopPropagation();
    close();
  }
</script>

<form
  class="flex w-full min-w-0 items-center gap-2"
  onsubmit={(event) => {
    event.preventDefault();
    submit();
  }}
>
  <SparklesIcon size={14} class="ui:text-muted-foreground shrink-0" />
  <Input
    bind:ref={input}
    bind:value={prompt}
    class="ui:border-transparent ui:bg-transparent ui:shadow-none h-7 px-0 text-[13px] focus-visible:border-transparent focus-visible:ring-0"
    placeholder={$t('course.navItem.lessons.materials.blocks.ai.prompt_placeholder')}
    aria-label={$t('course.navItem.lessons.materials.blocks.ai.prompt_label')}
    autocomplete="off"
    data-testid="block-ai-prompt"
    onkeydown={handleKeydown}
  />
  <Button
    type="button"
    variant="secondary"
    size="icon-xs"
    class="shrink-0"
    aria-label={$t('common.cancel')}
    title={$t('common.cancel')}
    onclick={close}
    testId="block-ai-close"
  >
    <XIcon size={14} />
  </Button>
</form>
