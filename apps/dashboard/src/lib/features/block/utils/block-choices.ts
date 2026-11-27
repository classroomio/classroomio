import AppWindowIcon from '@lucide/svelte/icons/app-window';
import AudioLinesIcon from '@lucide/svelte/icons/audio-lines';
import CodeIcon from '@lucide/svelte/icons/code';
import MilestoneIcon from '@lucide/svelte/icons/milestone';
import VoteIcon from '@lucide/svelte/icons/vote';
import { BLOCK_TYPES, type TBlockType } from '@cio/utils/validation/block';
import type { AddBlockChoice } from '@cio/ui/custom/add-block';
import { t } from '$lib/utils/functions/translations';
import { BLOCK_EDITORS } from './block-edit-registry';
import { blockTypeLabelKey } from './block-labels';

const NEW_BLOCK_TYPES: readonly TBlockType[] = ['chart', 'flashcards', 'tabs', 'multiple_choice', 'process', 'html'];

const DOCK_BLOCK_TYPES: readonly TBlockType[] = ['note', 'video', 'image', 'html', 'multiple_choice'];

const UPCOMING_BLOCKS = [
  { type: 'audio', icon: AudioLinesIcon },
  { type: 'poll', icon: VoteIcon },
  { type: 'timeline', icon: MilestoneIcon },
  { type: 'code', icon: CodeIcon },
  { type: 'embed', icon: AppWindowIcon }
] as const;

/**
 * The add-menu choices in registry order, with recently added types marked new.
 */
export function getAddBlockChoices(): AddBlockChoice[] {
  return BLOCK_TYPES.map((type) => ({
    type,
    label: t.get(blockTypeLabelKey(type)),
    icon: BLOCK_EDITORS[type].icon,
    isNew: NEW_BLOCK_TYPES.includes(type)
  }));
}

/**
 * The few choices pinned to the lesson's bottom dock: the common types, then the newest ones.
 */
export function getDockBlockChoices(): AddBlockChoice[] {
  const choices = getAddBlockChoices();

  return DOCK_BLOCK_TYPES.flatMap((type) => choices.filter((choice) => choice.type === type));
}

/**
 * Planned block types, listed in All blocks as disabled Coming soon tiles.
 */
export function getUpcomingBlockChoices(): AddBlockChoice[] {
  return UPCOMING_BLOCKS.map(({ type, icon }) => ({
    type: `upcoming_${type}`,
    label: t.get(`course.navItem.lessons.materials.blocks.upcoming.${type}`),
    icon,
    comingSoon: true
  }));
}
