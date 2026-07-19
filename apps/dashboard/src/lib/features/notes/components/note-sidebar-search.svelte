<script lang="ts">
  import SearchIcon from '@lucide/svelte/icons/search';
  import { cn } from '@cio/ui/tools';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    onclick?: () => void;
    class?: string;
  }

  let { onclick, class: className = '' }: Props = $props();
</script>

<button
  type="button"
  class={cn(
    'border-border ui:bg-background ui:hover:bg-muted/60 mx-3 flex h-9 w-[calc(100%-1.5rem)] items-center gap-2 rounded-md border px-3 text-left text-sm transition-colors',
    className
  )}
  {onclick}
>
  <SearchIcon size={16} class="ui:text-muted-foreground shrink-0" />
  <span class="ui:text-muted-foreground flex-1 truncate">{$t('notes.sidebar.search_placeholder')}</span>
  <kbd
    class="ui:text-muted-foreground hidden rounded border px-1.5 py-0.5 text-[10px] font-medium sm:inline-block"
  >
    ⌘K
  </kbd>
</button>
