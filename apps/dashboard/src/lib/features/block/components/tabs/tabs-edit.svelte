<script lang="ts">
  import * as Block from '@cio/ui/custom/block';
  import { TAB_NAME_MAX_LENGTH, TAB_NOTE_MAX_LENGTH, TABS_MAX_TABS } from '@cio/utils/validation/block';
  import type { BlockEditProps } from '../../utils/types';
  import { getNewTabName, getTabsLabels } from './tabs-labels';
  import TabsMedia from './tabs-media.svelte';
  import { addTab, removeTab, setTabMedia, setTabName, setTabNote, setTabsAlignment } from './tabs-utils';

  let { block, index, onDataChange, onRequestImage, onRequestVideo }: BlockEditProps<'tabs'> = $props();

  async function addImage(tabId: string) {
    const url = await onRequestImage();
    if (!url) return;

    onDataChange(setTabMedia(block.data, tabId, { kind: 'image', data: { url } }));
  }

  async function addVideo(tabId: string) {
    const video = await onRequestVideo();
    if (!video) return;

    onDataChange(setTabMedia(block.data, tabId, { kind: 'video', data: video }));
  }
</script>

<Block.Tabs
  editable
  tabs={block.data.tabs}
  align={block.data.align}
  maxTabs={TABS_MAX_TABS}
  nameMaxLength={TAB_NAME_MAX_LENGTH}
  noteMaxLength={TAB_NOTE_MAX_LENGTH}
  labels={getTabsLabels()}
  testId="block-tabs-edit"
  onNameInput={(tabId, name) => onDataChange(setTabName(block.data, tabId, name))}
  onNoteInput={(tabId, note) => onDataChange(setTabNote(block.data, tabId, note))}
  onAddTab={() => onDataChange(addTab(block.data, getNewTabName()))}
  onRemoveTab={(tabId) => onDataChange(removeTab(block.data, tabId))}
  onAlignChange={(align) => onDataChange(setTabsAlignment(block.data, align))}
>
  {#snippet content(tabId)}
    {@const tab = block.data.tabs.find((candidate) => candidate.id === tabId)}
    <TabsMedia
      media={tab?.media}
      blockId={block.id}
      {tabId}
      {index}
      editable
      onAddImage={() => void addImage(tabId)}
      onAddVideo={() => void addVideo(tabId)}
      onChange={(media) => onDataChange(setTabMedia(block.data, tabId, media))}
    />
  {/snippet}
</Block.Tabs>
