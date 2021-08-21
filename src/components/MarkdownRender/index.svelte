<script>
  import marked from 'marked';

  export let content = '';
</script>

<article class="m-auto prose prose-sm sm:prose p-2">
  {#if !!content}
    {@html marked(content, { breaks: true, gfm: true })}
  {/if}
</article>
