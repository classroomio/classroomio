<script>
  export let tags = [];
</script>

<div class="break-all">
  {#each tags as tag}
    <a
      class="text-blue-700 dark:text-blue-500 mr-5 text-sm"
      href="?filter={tag}">#{tag.toLowerCase()}</a
    >
  {/each}
</div>
