<script lang="ts">
  import LayoutGridIcon from '@lucide/svelte/icons/layout-grid';
  import ListIcon from '@lucide/svelte/icons/list';
  import { t } from '$lib/utils/functions/translations';
  import type { ViewMode } from '../utils/types';

  interface Props {
    view: ViewMode;
    onViewChange: (view: ViewMode) => void;
  }

  let { view = 'grid', onViewChange }: Props = $props();
</script>

<div class="border-input bg-card inline-flex h-9 items-center rounded-md border p-1">
  <button
    type="button"
    class="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-sm transition {view === 'grid'
      ? 'bg-accent text-accent-foreground font-semibold shadow-xs'
      : 'text-muted-foreground hover:text-foreground'}"
    title={$t('learningPath.listing.toolbar.grid_view')}
    aria-label={$t('learningPath.listing.toolbar.grid_view')}
    onclick={() => onViewChange('grid')}
  >
    <LayoutGridIcon class="size-4" />
  </button>

  <button
    type="button"
    class="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-sm transition {view === 'list'
      ? 'bg-accent text-accent-foreground font-semibold shadow-xs'
      : 'text-muted-foreground hover:text-foreground'}"
    title={$t('learningPath.listing.toolbar.list_view')}
    aria-label={$t('learningPath.listing.toolbar.list_view')}
    onclick={() => onViewChange('list')}
  >
    <ListIcon class="size-4" />
  </button>
</div>
