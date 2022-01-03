<script>
  import marked from 'marked';

  export let content = '';
  export let disableMaxWidth = false;
</script>

<article
  class="m-auto prose prose-sm sm:prose p-2 {disableMaxWidth &&
    'disable-max-width'}"
>
  {#if !!content}
    {@html marked(content, { breaks: true, gfm: true })}
  {/if}
</article>

<style>
  .disable-max-width {
    max-width: none !important;
    width: 100%;
  }
</style>
