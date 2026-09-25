import AwardIcon from '@lucide/svelte/icons/award';
import BlocksIcon from '@lucide/svelte/icons/blocks';
import GlobeIcon from '@lucide/svelte/icons/globe';
import PuzzleIcon from '@lucide/svelte/icons/puzzle';
import Share2Icon from '@lucide/svelte/icons/share-2';
import type { Component } from 'svelte';

const PLUGIN_ICONS: Record<string, Component> = {
  award: AwardIcon,
  blocks: BlocksIcon,
  globe: GlobeIcon,
  puzzle: PuzzleIcon,
  share2: Share2Icon
};

export function resolvePluginIcon(iconName?: string): Component {
  if (!iconName) return PuzzleIcon;

  return PLUGIN_ICONS[iconName] ?? PuzzleIcon;
}
