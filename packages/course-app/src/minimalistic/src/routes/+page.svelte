<script>
  import Home from '$lib/index.svelte';

  /** @type {{data: any}} */
  let { data } = $props();
</script>

<div>
  <Home {data} />
</div>
