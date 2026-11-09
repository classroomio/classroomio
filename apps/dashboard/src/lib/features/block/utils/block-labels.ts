import type { TBlockType } from '@cio/utils/validation/block';
import { t } from '$lib/utils/functions/translations';

export function blockTypeLabelKey(type: TBlockType): string {
  return `course.navItem.lessons.materials.blocks.types.${type}`;
}

export function blockChangeLabel(type: TBlockType): string {
  return t.get('course.navItem.lessons.materials.blocks.change_type', { type: t.get(blockTypeLabelKey(type)) });
}
