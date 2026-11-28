<script lang="ts">
  import { browser } from '$app/environment';
  import * as AddBlock from '@cio/ui/custom/add-block';
  import type { AddBlockChoice } from '@cio/ui/custom/add-block';
  import { t } from '$lib/utils/functions/translations';
  import { isBlockType, type TBlockType } from '@cio/utils/validation/block';
  import { aiPromptRequests, getAiShortcut } from '../utils/ai-prompt-request';
  import { getCatalogBlockChoices, getDockBlockChoices } from '../utils/block-choices';
  import BlockAiPrompt from './block-ai-prompt.svelte';

  interface Props {
    onSelect: (type: TBlockType) => void;
    /** Replaces opening the inline Ask AI panel, for a row that hands Ask AI off elsewhere. */
    onAi?: () => void;
  }

  let { onSelect, onAi }: Props = $props();

  const isMac = $derived(browser && /Mac|iPhone|iPad|iPod/.test(navigator.platform));

  const choices = $derived<AddBlockChoice[]>(getDockBlockChoices());
  const moreChoices = $derived<AddBlockChoice[]>(getCatalogBlockChoices());

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
  {moreChoices}
  addLabel={t.get('course.navItem.lessons.materials.blocks.add_content')}
  moreLabel={$t('course.navItem.lessons.materials.blocks.all_blocks')}
  searchLabel={$t('course.navItem.lessons.materials.blocks.search_blocks')}
  noResultsLabel={$t('course.navItem.lessons.materials.blocks.no_blocks_found')}
  newLabel={$t('course.navItem.lessons.materials.blocks.new_badge')}
  comingSoonLabel={$t('course.navItem.lessons.materials.blocks.coming_soon')}
  aiLabel={$t('ai_assistant.ask_ai')}
  aiPanelLabel={$t('course.navItem.lessons.materials.blocks.ai.title')}
  aiShortcut={getAiShortcut(isMac)}
  aiOpen={aiPanelOpen}
  rowTestId="block-add-row"
  toolbarTestId="block-add-toolbar"
  aiTriggerTestId="block-ai-trigger"
  aiPanelTestId="block-ai-panel"
  moreTestId="block-all-blocks"
  onSelect={handleSelect}
  onAiTrigger={() => (onAi ? onAi() : (aiPanelOpen = true))}
>
  {#snippet aiPanel()}
    <BlockAiPrompt open={aiPanelOpen} onClose={() => (aiPanelOpen = false)} />
  {/snippet}
</AddBlock.Row>
