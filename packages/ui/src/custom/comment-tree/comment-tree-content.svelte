<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    content?: string | null;
    class?: string;
    children?: Snippet;
  }

  let { content, class: className = '', children }: Props = $props();
</script>

<div class="ui:text-sm ui:leading-relaxed ui:text-foreground/90 {className}">
  {#if children}
    {@render children()}
  {:else if content}
    <p class="ui:whitespace-pre-line ui:break-words">{content}</p>
  {/if}
</div>
