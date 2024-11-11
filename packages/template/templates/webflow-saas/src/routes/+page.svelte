<script>
  import Home from '$lib/index.svelte';
  let { data } = $props();
</script>

<div>
  <Home {data} />
</div>
