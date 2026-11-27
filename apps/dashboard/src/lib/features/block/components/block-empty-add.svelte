<script lang="ts">
  import { browser } from '$app/environment';
  import * as AddBlock from '@cio/ui/custom/add-block';
  import { t } from '$lib/utils/functions/translations';
  import { isBlockType, type TBlockType } from '@cio/utils/validation/block';
  import { aiPromptRequests, getAiShortcut } from '../utils/ai-prompt-request';
  import { getCatalogBlockChoices, getDockBlockChoices } from '../utils/block-choices';
  import BlockAiPrompt from './block-ai-prompt.svelte';

  interface Props {
    onSelect: (type: TBlockType) => void;
  }

  let { onSelect }: Props = $props();

  const isMac = $derived(browser && /Mac|iPhone|iPad|iPod/.test(navigator.platform));

  let aiPromptOpen = $state(false);
  let catalogOpen = $state(false);

  $effect(() => {
    let initial = true;

    return aiPromptRequests.subscribe(() => {
      if (initial) {
        initial = false;
        return;
      }

      aiPromptOpen = true;
    });
  });

  function handleSelect(type: string) {
    if (!isBlockType(type)) return;

    onSelect(type);
  }
</script>

<div class="flex w-full flex-col items-center gap-4">
  <AddBlock.Grid
    choices={getDockBlockChoices()}
    label={t.get('course.navItem.lessons.materials.blocks.add_content')}
    newLabel={$t('course.navItem.lessons.materials.blocks.new_badge')}
    moreLabel={$t('course.navItem.lessons.materials.blocks.all_blocks')}
    moreOpen={catalogOpen}
    testId="block-empty-grid"
    onSelect={handleSelect}
    onMore={() => (catalogOpen = !catalogOpen)}
  />

  {#if catalogOpen}
    <div class="ui:border-border w-full rounded-xl border p-2.5">
      <AddBlock.Catalog
        choices={getCatalogBlockChoices()}
        label={$t('course.navItem.lessons.materials.blocks.all_blocks')}
        searchLabel={$t('course.navItem.lessons.materials.blocks.search_blocks')}
        noResultsLabel={$t('course.navItem.lessons.materials.blocks.no_blocks_found')}
        newLabel={$t('course.navItem.lessons.materials.blocks.new_badge')}
        comingSoonLabel={$t('course.navItem.lessons.materials.blocks.coming_soon')}
        autofocus
        testId="block-empty-catalog"
        onSelect={handleSelect}
      />
    </div>
  {/if}

  <AddBlock.AiLauncher
    label={$t('ai_assistant.ask_ai')}
    panelLabel={$t('course.navItem.lessons.materials.blocks.ai.title')}
    shortcut={getAiShortcut(isMac)}
    open={aiPromptOpen}
    testId="block-ai-launcher"
    triggerTestId="block-ai-trigger"
    panelTestId="block-ai-panel"
    onOpen={() => (aiPromptOpen = true)}
  >
    {#snippet panel()}
      <BlockAiPrompt open={aiPromptOpen} onClose={() => (aiPromptOpen = false)} />
    {/snippet}
  </AddBlock.AiLauncher>
</div>
