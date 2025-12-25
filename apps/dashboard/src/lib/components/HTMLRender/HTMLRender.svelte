<script lang="ts">
  let { children, className = '', id = '', disableMaxWidth = false } = $props();
</script>

<article
  style:max-width={disableMaxWidth ? 'unset' : undefined}
  {id}
  class="preview prose sm:prose-sm {className} dark:text-white"
>
  {@render children()}
</article>
