<script>
  export let content = '';
  export let className = '';
</script>

<article class="preview prose prose-sm sm:prose {className} dark:text-white">
  {#if $$slots.content}
    <slot name="content" />
  {:else}
    {@html content}
  {/if}
</article>
