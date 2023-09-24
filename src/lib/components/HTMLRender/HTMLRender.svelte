<script>
  import { marked } from 'marked';

  export let content = '';
  export let className = '';
</script>

<article class="preview prose prose-sm sm:prose {className}">
  {@html marked(content, { breaks: true, gfm: true })}
</article>
