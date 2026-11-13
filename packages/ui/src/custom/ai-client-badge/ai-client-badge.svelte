<script lang="ts">
  import { cn } from '../../tools';
  import { resolveAiClient } from './ai-client';

  interface Props {
    /** Name stored with the change, e.g. `Claude`, `claude-ai` or the name an unknown client reported. */
    clientName: string;
    class?: string;
  }

  let { clientName, class: className = '' }: Props = $props();

  const client = $derived(resolveAiClient(clientName));
  const monogram = $derived((client.label.trim()[0] ?? '?').toUpperCase());
</script>

<span class={cn('ui:inline-flex ui:items-center ui:gap-1.5', className)}>
  {#if client.iconPath}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="currentColor"
      aria-hidden="true"
      class={cn('ui:shrink-0', client.kind.startsWith('claude') && 'ui:text-[#D97757]')}
    >
      <path d={client.iconPath} />
    </svg>
  {:else}
    <span
      aria-hidden="true"
      class="ui:bg-muted ui:text-muted-foreground ui:inline-flex ui:size-4 ui:shrink-0 ui:items-center ui:justify-center ui:rounded-sm ui:text-[10px] ui:leading-none ui:font-semibold"
    >
      {monogram}
    </span>
  {/if}
  <span class="ui:truncate">{client.label}</span>
</span>
