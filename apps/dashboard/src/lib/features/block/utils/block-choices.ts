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

const BLOCKS_KEY = 'course.navItem.lessons.materials.blocks';

const NEW_BLOCK_TYPES: readonly TBlockType[] = ['chart', 'flashcards', 'tabs', 'multiple_choice', 'process', 'html'];

const DOCK_BLOCK_TYPES: readonly TBlockType[] = ['note', 'video', 'image', 'html', 'multiple_choice'];

const BLOCK_GROUPS: Record<TBlockType, string> = {
  note: 'text',
  tabs: 'text',
  process: 'text',
  video: 'media',
  slides: 'media',
  document: 'media',
  image: 'media',
  chart: 'interactive',
  flashcards: 'interactive',
  multiple_choice: 'interactive',
  html: 'advanced'
};

const UPCOMING_BLOCKS = [
  { type: 'audio', group: 'media', icon: AudioLinesIcon },
  { type: 'poll', group: 'interactive', icon: VoteIcon },
  { type: 'timeline', group: 'interactive', icon: MilestoneIcon },
  { type: 'code', group: 'advanced', icon: CodeIcon },
  { type: 'embed', group: 'advanced', icon: AppWindowIcon }
] as const;

/**
 * Every block type in registry order, with its catalog group and description, and recently added types marked new.
 */
export function getAddBlockChoices(): AddBlockChoice[] {
  return BLOCK_TYPES.map((type) => ({
    type,
    label: t.get(blockTypeLabelKey(type)),
    description: t.get(`${BLOCKS_KEY}.descriptions.${type}`),
    group: t.get(`${BLOCKS_KEY}.groups.${BLOCK_GROUPS[type]}`),
    icon: BLOCK_EDITORS[type].icon,
    isNew: NEW_BLOCK_TYPES.includes(type)
  }));
}

/**
 * The few choices pinned to the add bar and the empty lesson: the common types, then the newest ones.
 */
export function getDockBlockChoices(): AddBlockChoice[] {
  const choices = getAddBlockChoices();

  return DOCK_BLOCK_TYPES.flatMap((type) => choices.filter((choice) => choice.type === type));
}

/**
 * Every block type for the All blocks catalog, followed by planned types shown as disabled Coming soon tiles.
 */
export function getCatalogBlockChoices(): AddBlockChoice[] {
  const upcoming = UPCOMING_BLOCKS.map(({ type, group, icon }) => ({
    type: `upcoming_${type}`,
    label: t.get(`${BLOCKS_KEY}.upcoming.${type}`),
    description: t.get(`${BLOCKS_KEY}.descriptions.${type}`),
    group: t.get(`${BLOCKS_KEY}.groups.${group}`),
    icon,
    comingSoon: true
  }));

  return [...getAddBlockChoices(), ...upcoming];
}
