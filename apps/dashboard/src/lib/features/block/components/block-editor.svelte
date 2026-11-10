<script lang="ts">
  import { fade } from 'svelte/transition';
  import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
  import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import * as Block from '@cio/ui/custom/block';
  import { isBlockType, type TBlockDataByType, type TBlockType } from '@cio/utils/validation/block';
  import type { TLocale } from '@cio/db/types';
  import { t } from '$lib/utils/functions/translations';
  import type { BlockListApi } from '../api/block-list.svelte';
  import { setBlockEditHost } from '../utils/block-host';
  import { getAddBlockChoices } from '../utils/block-choices';
  import { blockTypeLabelKey } from '../utils/block-labels';
  import { getBlockContent } from '../utils/block-list-utils';
  import { getBlockEditor } from '../utils/block-edit-registry';
  import type { BlockEditHost, BlockOf, BlockRecord } from '../utils/types';
  import { VideoGuideCard } from '@cio/ui/custom/video-guide';
  import { VIDEO_GUIDES } from '$features/video-guide/utils/video-guide-utils';
  import BlockAddRow from './block-add-row.svelte';

  interface Props {
    api: BlockListApi;
    locale: TLocale;
    host: BlockEditHost;
    spacingClass?: string;
  }

  let { api, locale, host, spacingClass }: Props = $props();

  setBlockEditHost(() => host);

  const DRAG_HINT_KEY = 'classroomio:lesson-block-drag-hint-dismissed';

  interface PickerRequest {
    type: TBlockType;
    index: number;
    replaceBlockId?: string;
  }

  let picker = $state<PickerRequest | null>(null);

  const Picker = $derived(picker ? getBlockEditor(picker.type).picker : undefined);

  function add(type: TBlockType, index: number) {
    const initial = getBlockEditor(type).createInitial();
    if (initial) {
      void api.insert(type, index, initial, locale);
      return;
    }

    picker = { type, index };
  }

  function handleAdd(type: string, index: number) {
    if (!isBlockType(type)) return;

    add(type, index);
  }

  async function handlePick(items: TBlockDataByType[TBlockType][]) {
    const request = picker;
    if (!request) return;

    const [first, ...rest] = items;
    let index = request.index;

    if (request.replaceBlockId && first) {
      await api.updateData(request.replaceBlockId, first);
      index = api.blocks.findIndex((block) => block.id === request.replaceBlockId) + 1;
    }

    const toInsert = request.replaceBlockId ? rest : items;
    for (const data of toInsert) {
      await api.insert(request.type, index, { data }, locale);
      index += 1;
    }

    if (picker === request) picker = { type: request.type, index };
  }

  function requestSource(block: BlockRecord) {
    picker = {
      type: block.type,
      index: api.blocks.indexOf(block),
      replaceBlockId: block.id
    };
  }

  function menuItems(block: BlockRecord, index: number, total: number): Block.BlockShellMenuItem[] {
    return [
      {
        label: t.get('course.navItem.lessons.materials.blocks.move_up'),
        icon: ArrowUpIcon,
        disabled: index === 0,
        onSelect: () => void api.move(block.id, -1)
      },
      {
        label: t.get('course.navItem.lessons.materials.blocks.move_down'),
        icon: ArrowDownIcon,
        disabled: index === total - 1,
        onSelect: () => void api.move(block.id, 1)
      },
      {
        label: t.get('course.navItem.lessons.materials.blocks.remove'),
        icon: Trash2Icon,
        destructive: true,
        onSelect: () => void api.remove(block.id)
      }
    ];
  }
</script>

<Block.List
  items={api.blocks}
  editable
  {spacingClass}
  addChoices={getAddBlockChoices()}
  addLabel={t.get('course.navItem.lessons.materials.blocks.add_content')}
  emptyTitle={t.get('course.navItem.lessons.materials.blocks.empty_title')}
  emptyDescription={t.get('course.navItem.lessons.materials.blocks.empty_description')}
  emptyMachineHeading={t.get('course.navItem.lessons.add_content_options.lesson_title').toLocaleUpperCase()}
  scrollRailLabel={t.get('course.navItem.lessons.materials.blocks.scroll_rail')}
  goToBlockLabel={(index) => t.get('course.navItem.lessons.materials.blocks.go_to_block', { index })}
  itemTitle={(block) => t.get(blockTypeLabelKey(block.type))}
  dragHintLabel={t.get('course.navItem.lessons.materials.blocks.drag_hint')}
  dismissHintLabel={t.get('course.navItem.lessons.materials.blocks.dismiss_hint')}
  storageKey={DRAG_HINT_KEY}
  highlightId={api.lastInsertedId}
  onAdd={handleAdd}
  onReorder={(blocks) => void api.reorder(blocks)}
>
  {#snippet emptyAction()}
    <BlockAddRow onSelect={(type) => add(type, 0)} />
    <div class="mt-6 w-full">
      <VideoGuideCard
        videoId={VIDEO_GUIDES.lessonBlocks.videoId}
        title={t.get(VIDEO_GUIDES.lessonBlocks.titleKey)}
        description={t.get('video_guide.lesson_blocks.description')}
        badgeLabel={t.get('video_guide.new_badge')}
        actionLabel={t.get('video_guide.watch_video')}
        closeLabel={t.get('video_guide.close')}
        testId="block-empty-video-guide"
      />
    </div>
  {/snippet}

  {#snippet renderItem({ item: block, index, total, highlighted })}
    {@const editor = getBlockEditor(block.type)}
    {@const Edit = editor.edit}
    <Block.Shell
      blockId={block.id}
      label={t.get(blockTypeLabelKey(block.type))}
      editable
      {highlighted}
      dragLabel={t.get('course.navItem.lessons.materials.blocks.drag')}
      actionsLabel={t.get('course.navItem.lessons.materials.blocks.actions')}
      menuItems={menuItems(block, index, total)}
    >
      <Edit
        block={block as BlockOf<TBlockType>}
        {index}
        {locale}
        content={getBlockContent(block, locale)}
        onDataChange={(data: Record<string, unknown>) => void api.updateData(block.id, data)}
        onContentChange={(content: string) => api.setContent(block.id, locale, content)}
        onRequestSource={editor.picker ? () => requestSource(block) : undefined}
      />
    </Block.Shell>
  {/snippet}
</Block.List>

{#if api.blocks.length > 0}
  <div
    class="pointer-events-none fixed right-0 bottom-4 left-0 z-50 flex justify-center md:right-[var(--side-panel-width,0px)] md:left-[var(--sidebar-width,0px)]"
    in:fade={{ duration: 150 }}
    out:fade={{ duration: 100 }}
  >
    <div class="pointer-events-auto rounded-xl">
      <BlockAddRow onSelect={(type) => add(type, api.blocks.length)} />
    </div>
  </div>
{/if}

{#if picker && Picker}
  <Picker open onPick={handlePick} onClose={() => (picker = null)} />
{/if}
