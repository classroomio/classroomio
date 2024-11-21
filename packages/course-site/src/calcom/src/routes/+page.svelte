<script>
  import Home from '$lib/index.svelte';

  let { data } = $props();
</script>

<div class="font-matter">
  <Home {data} />
</div>
