<script lang="ts">
  import type { Snippet } from 'svelte';
  import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
  import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import { BlockShell, type BlockShellMenuItem } from '@cio/ui/custom/block-shell';
  import { t } from '$lib/utils/functions/translations';
  import type { LessonBlock } from '$features/course/utils/types';

  interface Props {
    block: LessonBlock;
    index: number;
    total: number;
    editable: boolean;
    highlighted?: boolean;
    onRemove?: () => void;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    children: Snippet;
  }

  let {
    block,
    index,
    total,
    editable,
    highlighted = false,
    onRemove = () => {},
    onMoveUp = () => {},
    onMoveDown = () => {},
    children
  }: Props = $props();

  const typeLabelKeys: Record<LessonBlock['type'], string> = {
    video: 'course.navItem.lessons.materials.blocks.types.video',
    note: 'course.navItem.lessons.materials.blocks.types.note',
    slide: 'course.navItem.lessons.materials.blocks.types.slides',
    document: 'course.navItem.lessons.materials.blocks.types.document',
    image: 'course.navItem.lessons.materials.blocks.types.image'
  };

  const typeLabel = $derived(t.get(typeLabelKeys[block.type]));

  const menuItems = $derived<BlockShellMenuItem[]>([
    {
      label: t.get('course.navItem.lessons.materials.blocks.move_up'),
      icon: ArrowUpIcon,
      disabled: index === 0,
      onSelect: onMoveUp
    },
    {
      label: t.get('course.navItem.lessons.materials.blocks.move_down'),
      icon: ArrowDownIcon,
      disabled: index === total - 1,
      onSelect: onMoveDown
    },
    {
      label: t.get('course.navItem.lessons.materials.blocks.remove'),
      icon: Trash2Icon,
      destructive: true,
      onSelect: onRemove
    }
  ]);
</script>

<BlockShell
  blockId={block.id}
  label={typeLabel}
  badge={block.isExample ? t.get('course.navItem.lessons.materials.blocks.example') : undefined}
  {editable}
  {highlighted}
  dragLabel={t.get('course.navItem.lessons.materials.blocks.drag')}
  actionsLabel={t.get('course.navItem.lessons.materials.blocks.actions')}
  {menuItems}
>
  {@render children()}
</BlockShell>
