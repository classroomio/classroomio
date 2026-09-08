<script lang="ts">
  import CornerDownRightIcon from '@lucide/svelte/icons/corner-down-right';
  import MessageSquareIcon from '@lucide/svelte/icons/message-square';
  import { Button } from '../../base/button';

  interface Props {
    kind?: 'more' | 'continue';
    label: string;
    loading?: boolean;
    onclick: () => void;
    class?: string;
  }

  let { kind = 'more', label, loading = false, onclick, class: className = '' }: Props = $props();
</script>

<Button
  variant="ghost"
  size="xs"
  {onclick}
  {loading}
  class="ui:w-fit ui:gap-1.5 ui:px-0 ui:text-xs ui:font-medium ui:text-muted-foreground ui:hover:bg-transparent ui:hover:text-foreground {className}"
>
  {#if kind === 'continue'}
    <CornerDownRightIcon size={14} aria-hidden="true" />
  {:else}
    <MessageSquareIcon size={14} aria-hidden="true" />
  {/if}
  <span>{label}</span>
</Button>
