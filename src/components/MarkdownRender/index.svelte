<script>
  import marked from 'marked';

  export let content;
</script>

<article class="prose prose-sm sm:prose p-2">
  {@html marked(content, { breaks: true, gfm: true })}
</article>
