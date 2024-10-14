<script>
  import { browser } from '$app/environment';

  import Home from '$lib/index.svelte';
  export let data;

  console.log('data in parent:', data);
</script>

<div>
  <Home {data} />
</div>
