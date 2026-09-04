<script lang="ts">
  import PlusIcon from '@lucide/svelte/icons/plus';
  import { Spinner } from '@cio/ui/base/spinner';
  import { cn } from '@cio/ui/tools';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    loading?: boolean;
    onclick?: () => void;
    class?: string;
  }

  let { loading = false, onclick, class: className = '' }: Props = $props();
</script>

<button
  type="button"
  class={cn(
    'ui:hover:bg-muted/60 mx-3 flex h-9 w-[calc(100%-1.5rem)] items-center gap-2 rounded-md px-2 text-left text-sm font-medium transition-colors',
    className
  )}
  disabled={loading}
  {onclick}
>
  {#if loading}
    <Spinner class="size-4" />
  {:else}
    <PlusIcon size={16} class="ui:text-muted-foreground shrink-0" />
  {/if}
  <span>{$t('docs.sidebar.new_note')}</span>
</button>
