<script>
  import { marked } from 'marked';

  export let content = '';
  export let className = '';
</script>

<article class="preview prose prose-sm sm:prose {className}">
  {#if $$slots.content}
    <slot name="content" />
  {:else}
    {@html marked(content, { breaks: true, gfm: true })}
  {/if}
</article>
