<script lang="ts">
  import SparklesIcon from '@lucide/svelte/icons/sparkles';

  import { cn } from '../../tools';
  import { AI_CLIENT_LABELS, resolveAiClient } from './ai-client';
  import ChatgptIcon from './chatgpt-icon.svelte';
  import ClaudeIcon from './claude-icon.svelte';

  interface Props {
    /** Name stored with the change, e.g. `Claude`, `claude-ai` or the name an unknown client reported. */
    clientName: string;
    class?: string;
  }

  let { clientName, class: className = '' }: Props = $props();

  const kind = $derived(resolveAiClient(clientName));
  const label = $derived(kind === 'generic' ? clientName : AI_CLIENT_LABELS[kind]);
</script>

<span class={cn('ui:inline-flex ui:items-center ui:gap-1.5', className)}>
  {#if kind === 'claude'}
    <ClaudeIcon class="ui:text-[#D97757]" />
  {:else if kind === 'chatgpt'}
    <ChatgptIcon />
  {:else}
    <SparklesIcon class="ui:size-4 ui:shrink-0" aria-hidden="true" />
  {/if}
  <span class="ui:truncate">{label}</span>
</span>
