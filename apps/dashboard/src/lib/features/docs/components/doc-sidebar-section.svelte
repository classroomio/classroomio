<script lang="ts">
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import { cn } from '@cio/ui/tools';

  interface Props {
    title: string;
    expanded?: boolean;
    onToggle?: () => void;
    class?: string;
    children?: import('svelte').Snippet;
  }

  let { title, expanded = true, onToggle, class: className = '', children }: Props = $props();
</script>

<section class={cn('py-1', className)}>
  <button
    type="button"
    class="ui:hover:bg-muted/40 flex w-full items-center gap-2 px-4 py-2 text-left"
    onclick={() => onToggle?.()}
  >
    <ChevronDownIcon
      size={14}
      class={cn('ui:text-muted-foreground shrink-0 transition-transform', !expanded && '-rotate-90')}
    />
    <span class="ui:text-muted-foreground text-xs font-semibold tracking-wide uppercase">{title}</span>
  </button>

  {#if expanded}
    <div class="pb-1">
      {@render children?.()}
    </div>
  {/if}
</section>
