<script lang="ts">
  import { cn } from '@cio/ui/tools';
  import { t } from '$lib/utils/functions/translations';
  import GridIcon from '@lucide/svelte/icons/grid-2x2';
  import ListIcon from '@lucide/svelte/icons/list';

  export type ViewMode = 'grid' | 'list';

  interface Props {
    view?: ViewMode;
    onChange?: (view: ViewMode) => void;
    class?: string;
  }

  let { view = 'grid', onChange, class: className }: Props = $props();
</script>

<div class={cn('flex items-center gap-1 rounded-lg border p-1', className)}>
  <button
    type="button"
    onclick={() => onChange?.('grid')}
    class={cn(
      'flex size-6 items-center justify-center rounded-md transition-colors',
      view === 'grid' ? 'ui:bg-primary/10' : 'ui:hover:text-foreground'
    )}
    title={$t('learningPath.toolbar.grid_view')}
    aria-label={$t('learningPath.toolbar.grid_view')}
    aria-pressed={view === 'grid'}
  >
    <GridIcon class="size-4" color={view === 'grid' ? 'black' : 'gray'} />
  </button>
  <button
    type="button"
    onclick={() => onChange?.('list')}
    class={cn(
      'flex size-6 items-center justify-center rounded-md transition-colors',
      view === 'list' ? 'ui:bg-primary/10' : 'ui:hover:text-foreground'
    )}
    title={$t('learningPath.toolbar.list_view')}
    aria-label={$t('learningPath.toolbar.list_view')}
    aria-pressed={view === 'list'}
  >
    <ListIcon class="size-4" color={view === 'list' ? 'black' : 'gray'} />
  </button>
</div>
