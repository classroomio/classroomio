import { BLOCK_TYPES } from '@cio/utils/validation/block';
import type { AddBlockChoice } from '@cio/ui/custom/add-block';
import { t } from '$lib/utils/functions/translations';
import { BLOCK_EDITORS } from './block-edit-registry';
import { blockTypeLabelKey } from './block-labels';

export function getAddBlockChoices(): AddBlockChoice[] {
  return BLOCK_TYPES.map((type) => ({ type, label: t.get(blockTypeLabelKey(type)), icon: BLOCK_EDITORS[type].icon }));
}
