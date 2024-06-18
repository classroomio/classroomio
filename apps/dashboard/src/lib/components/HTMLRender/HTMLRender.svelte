<script>
  export let content = '';
  export let className = '';
  export let id = '';
</script>

<article {id} class="preview prose prose-sm sm:prose {className} dark:text-white">
  {#if $$slots.content}
    <slot name="content" />
  {:else}
    {@html content}
  {/if}
</article>
