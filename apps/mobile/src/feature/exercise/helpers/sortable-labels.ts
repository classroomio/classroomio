import type { SortableListLabels } from '@/feature/common/components/sortable-list';
import type { ExerciseTranslator } from '@/feature/exercise/types/exercise';

export function sortableLabelsOf(t: ExerciseTranslator): SortableListLabels {
  return {
    itemPosition: (label, position, total) => t('sortablePosition', { label, position, total }),
    hint: t('sortableHint'),
    moveUp: t('moveUp'),
    moveDown: t('moveDown')
  };
}
