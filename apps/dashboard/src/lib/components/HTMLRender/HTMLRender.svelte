<script>
  export let content = '';
  export let className = '';
  export let id = '';
  export let disableMaxWidth = false;
</script>

<article
  style:max-width={disableMaxWidth ? 'unset' : undefined}
  {id}
  class="preview prose sm:prose-sm {className} dark:text-white"
>
  {#if $$slots.content}
    <slot name="content" />
  {:else}
    {@html content}
  {/if}
</article>
