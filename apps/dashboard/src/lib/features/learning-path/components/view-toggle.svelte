<script lang="ts">
  import { cn } from '@cio/ui/tools';
  import { t } from '$lib/utils/functions/translations';
  import type { LearningPathView } from './types';
  import GridIcon from '@lucide/svelte/icons/grid-2x2';
  import ListIcon from '@lucide/svelte/icons/list';

  interface Props {
    view: LearningPathView;
    onChange?: (view: LearningPathView) => void;
  }

  let { view, onChange }: Props = $props();
</script>

<div class="flex items-center gap-1 rounded-lg border p-1">
  <button
    type="button"
    onclick={() => onChange?.('grid')}
    class={cn(
      'flex size-8 items-center justify-center rounded-md transition-colors',
      view === 'grid' ? 'ui:bg-primary/10 ui:text-primary' : 'ui:text-muted-foreground ui:hover:text-foreground'
    )}
    title={$t('learningPath.toolbar.grid_view')}
    aria-label={$t('learningPath.toolbar.grid_view')}
    aria-pressed={view === 'grid'}
  >
    <GridIcon class="size-4" />
  </button>
  <button
    type="button"
    onclick={() => onChange?.('list')}
    class={cn(
      'flex size-8 items-center justify-center rounded-md transition-colors',
      view === 'list' ? 'ui:bg-primary/10 ui:text-primary' : 'ui:text-muted-foreground ui:hover:text-foreground'
    )}
    title={$t('learningPath.toolbar.list_view')}
    aria-label={$t('learningPath.toolbar.list_view')}
    aria-pressed={view === 'list'}
  >
    <ListIcon class="size-4" />
  </button>
</div>
