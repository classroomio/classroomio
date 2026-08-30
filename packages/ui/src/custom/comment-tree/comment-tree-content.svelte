<script lang="ts">
  import type { Snippet } from 'svelte';
  import { sanitizeHtml } from '../../tools/sanitize';

  interface Props {
    content?: string | null;
    class?: string;
    children?: Snippet;
  }

  let { content, class: className = '', children }: Props = $props();

  let formattedContent = $derived(content ? sanitizeHtml(content.replace(/(<\/blockquote>)\s+/gi, '$1')) : '');
</script>

<div class="ui:text-sm ui:leading-snug ui:text-foreground/90 ui:whitespace-pre-line ui:break-words {className}">
  {#if children}
    {@render children()}
  {:else if formattedContent}
    {@html formattedContent}
  {/if}
</div>
