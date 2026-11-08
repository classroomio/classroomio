<script lang="ts">
  import { browser } from '$app/environment';
  import { tick } from 'svelte';
  import SparklesIcon from '@lucide/svelte/icons/sparkles';
  import XIcon from '@lucide/svelte/icons/x';
  import { Button } from '@cio/ui/base/button';
  import { Input } from '@cio/ui/base/input';
  import * as AddBlock from '@cio/ui/custom/add-block';
  import type { AddBlockChoice } from '@cio/ui/custom/add-block';
  import { t } from '$lib/utils/functions/translations';
  import { sendPromptToAssistant } from '$features/ai-assistant/utils/store';
  import { getAddContentChoices } from './lesson-add-content-choices';
  import { isLessonBlockInsertType } from '$features/course/utils/lesson-blocks';
  import type { LessonBlockInsertType } from '$features/course/utils/types';

  interface Props {
    onSelect: (type: LessonBlockInsertType) => void;
  }

  let { onSelect }: Props = $props();

  const isMac = $derived(browser && /Mac|iPhone|iPad|iPod/.test(navigator.platform));

  const choices = $derived<AddBlockChoice[]>(getAddContentChoices());

  function handleSelect(type: string) {
    if (!isLessonBlockInsertType(type)) return;

    onSelect(type);
  }

  let aiPanelOpen = $state(false);
  let aiPrompt = $state('');
  let aiPromptInput = $state<HTMLInputElement | null>(null);

  async function openAiPanel() {
    if (aiPanelOpen) return;

    aiPanelOpen = true;
    await tick();
    aiPromptInput?.focus();
  }

  function closeAiPanel() {
    if (!aiPanelOpen) return;

    aiPrompt = '';
    aiPanelOpen = false;
  }

  function submitAiPrompt() {
    const prompt = aiPrompt.trim();
    if (!prompt) return;

    closeAiPanel();
    sendPromptToAssistant(prompt);
  }

  function handleAiKeydown(event: KeyboardEvent) {
    if (event.key !== 'Escape') return;

    event.preventDefault();
    event.stopPropagation();
    closeAiPanel();
  }
</script>

<AddBlock.Row
  {choices}
  addLabel={t.get('course.navItem.lessons.materials.blocks.add_content')}
  aiLabel={$t('ai_assistant.ask_ai')}
  aiPanelLabel={$t('course.navItem.lessons.materials.blocks.ai.title')}
  aiShortcut={{ modifier: isMac ? '⌘' : 'Ctrl', key: 'I' }}
  aiOpen={aiPanelOpen}
  rowTestId="lesson-add-content-row"
  toolbarTestId="lesson-add-content-toolbar"
  aiTriggerTestId="lesson-ai-trigger"
  aiPanelTestId="lesson-ai-panel"
  onSelect={handleSelect}
  onAiTrigger={openAiPanel}
>
  {#snippet aiPanel()}
    <form
      class="flex w-full min-w-0 items-center gap-2"
      onsubmit={(event) => {
        event.preventDefault();
        submitAiPrompt();
      }}
    >
      <SparklesIcon size={14} class="ui:text-muted-foreground shrink-0" />
      <Input
        bind:ref={aiPromptInput}
        bind:value={aiPrompt}
        class="ui:border-transparent ui:bg-transparent ui:shadow-none h-7 px-0 text-[13px] focus-visible:border-transparent focus-visible:ring-0"
        placeholder={$t('course.navItem.lessons.materials.blocks.ai.prompt_placeholder')}
        aria-label={$t('course.navItem.lessons.materials.blocks.ai.prompt_label')}
        autocomplete="off"
        data-testid="lesson-ai-prompt"
        onkeydown={handleAiKeydown}
      />
      <Button
        type="button"
        variant="secondary"
        size="icon-xs"
        class="shrink-0"
        aria-label={$t('common.cancel')}
        title={$t('common.cancel')}
        onclick={closeAiPanel}
        testId="lesson-ai-close"
      >
        <XIcon size={14} />
      </Button>
    </form>
  {/snippet}
</AddBlock.Row>
