<script lang="ts">
  import { t } from '$lib/utils/functions/translations';
  import type { PathDifficulty } from '../utils/types';
  import type { CourseStatus, LearningPathView } from './types';
  import FilterPopover, { type FilterGroup } from './filter-popover.svelte';
  import ViewToggle from './view-toggle.svelte';

  interface Props {
    status?: CourseStatus | 'ALL';
    difficulty?: PathDifficulty | 'ALL';
    view?: LearningPathView;
  }

  let {
    status = $bindable<CourseStatus | 'ALL'>('ALL'),
    difficulty = $bindable<PathDifficulty | 'ALL'>('ALL'),
    view = $bindable<LearningPathView>('grid')
  }: Props = $props();

  const selected = $derived<Record<string, string>>({ status, difficulty });

  const groups = $derived<FilterGroup[]>([
    {
      id: 'status',
      label: $t('learningPath.toolbar.status'),
      options: [
        { value: 'ALL', label: $t('learningPath.toolbar.all') },
        { value: 'NOT_STARTED', label: $t('learningPath.enrollment.not_started') },
        { value: 'IN_PROGRESS', label: $t('learningPath.enrollment.in_progress') },
        { value: 'COMPLETED', label: $t('learningPath.enrollment.completed') }
      ]
    },
    {
      id: 'difficulty',
      label: $t('learningPath.toolbar.difficulty'),
      options: [
        { value: 'ALL', label: $t('learningPath.toolbar.difficulty_any') },
        { value: 'Beginner', label: $t('learningPath.toolbar.difficulty_beginner') },
        { value: 'Intermediate', label: $t('learningPath.toolbar.difficulty_intermediate') },
        { value: 'Advanced', label: $t('learningPath.toolbar.difficulty_advanced') }
      ]
    }
  ]);

  function handleChange(groupId: string, value: string) {
    if (groupId === 'status') status = value as CourseStatus | 'ALL';
    if (groupId === 'difficulty') difficulty = value as PathDifficulty | 'ALL';
  }
</script>

<div class="flex flex-wrap items-center justify-end gap-3">
  <FilterPopover {groups} {selected} onChange={handleChange} />
  <ViewToggle {view} onChange={(next) => (view = next)} />
</div>
