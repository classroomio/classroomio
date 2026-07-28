<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    content?: string | null;
    class?: string;
    children?: Snippet;
  }

  let { content, class: className = '', children }: Props = $props();

  let formattedContent = $derived(content ? content.replace(/(<\/blockquote>)\s+/gi, '$1') : '');
</script>

<div class="ui:text-sm ui:leading-relaxed ui:text-foreground/90 ui:whitespace-pre-line ui:break-words {className}">
  {#if children}
    {@render children()}
  {:else if formattedContent}
    {@html formattedContent}
  {/if}
</div>
