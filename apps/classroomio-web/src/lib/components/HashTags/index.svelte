<script>
  export let tags = [];
</script>

<div class="break-all">
  {#each tags as tag}
    <a class="text-primary-700 dark:text-primary-500 mr-5 text-sm" href="?filter={tag}"
      >#{tag.toLowerCase()}</a
    >
  {/each}
</div>
