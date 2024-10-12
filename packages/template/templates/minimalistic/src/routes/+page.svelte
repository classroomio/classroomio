<script>
  import { globalData } from '$lib/component/store.js';
  import Home from '$lib/index.svelte';
  export let data;

  console.log('data in parent:', data);
</script>

<div class="font-ibm">
  <Home {data} />
</div>
