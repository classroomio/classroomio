<script lang="ts">
  import { t } from '$lib/utils/functions/translations';
  import type { LearningPathStatus, PathDifficulty } from '../utils/types';
  import type { LearningPathView, DurationFilter } from './types';
  import FilterPopover, { type FilterGroup } from './filter-popover.svelte';
  import ViewToggle from './view-toggle.svelte';

  interface Props {
    status?: LearningPathStatus | 'ALL';
    difficulty?: PathDifficulty | 'ALL';
    duration?: DurationFilter | 'ALL';
    view?: LearningPathView;
  }

  let {
    status = $bindable<LearningPathStatus | 'ALL'>('ALL'),
    difficulty = $bindable<PathDifficulty | 'ALL'>('ALL'),
    duration = $bindable<DurationFilter | 'ALL'>('ALL'),
    view = $bindable<LearningPathView>('grid')
  }: Props = $props();

  const selected = $derived<Record<string, string>>({ status, difficulty, duration });

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
    },
    {
      id: 'duration',
      label: $t('learningPath.toolbar.duration'),
      options: [
        { value: 'ALL', label: $t('learningPath.toolbar.duration_any') },
        { value: 'under-4', label: $t('learningPath.toolbar.duration_under4') },
        { value: '4-10', label: $t('learningPath.toolbar.duration_4to10') },
        { value: '10-up', label: $t('learningPath.toolbar.duration_10up') }
      ]
    }
  ]);

  function handleChange(groupId: string, value: string) {
    if (groupId === 'status') status = value as LearningPathStatus | 'ALL';
    if (groupId === 'difficulty') difficulty = value as PathDifficulty | 'ALL';
    if (groupId === 'duration') duration = value as DurationFilter | 'ALL';
  }
</script>

<div class="flex flex-wrap items-center justify-between gap-3">
  <FilterPopover {groups} {selected} onChange={handleChange} />
  <ViewToggle {view} onChange={(next) => (view = next)} />
</div>
