<script lang="ts">
  import { browser } from '$app/environment';
  import * as AddBlock from '@cio/ui/custom/add-block';
  import type { AddBlockChoice } from '@cio/ui/custom/add-block';
  import { t } from '$lib/utils/functions/translations';
  import { isBlockType, type TBlockType } from '@cio/utils/validation/block';
  import { aiPromptRequests, getAiShortcut } from '../utils/ai-prompt-request';
  import { getAddBlockChoices } from '../utils/block-choices';
  import BlockAiPrompt from './block-ai-prompt.svelte';

  interface Props {
    onSelect: (type: TBlockType) => void;
  }

  let { onSelect }: Props = $props();

  const isMac = $derived(browser && /Mac|iPhone|iPad|iPod/.test(navigator.platform));

  const choices = $derived<AddBlockChoice[]>(getAddBlockChoices());

  let aiPanelOpen = $state(false);

  $effect(() => {
    let initial = true;

    return aiPromptRequests.subscribe(() => {
      if (initial) {
        initial = false;
        return;
      }

      aiPanelOpen = true;
    });
  });

  function handleSelect(type: string) {
    if (!isBlockType(type)) return;

    onSelect(type);
  }
</script>

<AddBlock.Row
  {choices}
  addLabel={t.get('course.navItem.lessons.materials.blocks.add_content')}
  aiLabel={$t('ai_assistant.ask_ai')}
  aiPanelLabel={$t('course.navItem.lessons.materials.blocks.ai.title')}
  aiShortcut={getAiShortcut(isMac)}
  aiOpen={aiPanelOpen}
  rowTestId="block-add-row"
  toolbarTestId="block-add-toolbar"
  aiTriggerTestId="block-ai-trigger"
  aiPanelTestId="block-ai-panel"
  onSelect={handleSelect}
  onAiTrigger={() => (aiPanelOpen = true)}
>
  {#snippet aiPanel()}
    <BlockAiPrompt open={aiPanelOpen} onClose={() => (aiPanelOpen = false)} />
  {/snippet}
</AddBlock.Row>
