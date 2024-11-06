<script>
  import { browser } from '$app/environment';
  import Home from '$lib/index.svelte';
  import { toggleBodyByMode } from '$lib/utils/toggleMode';

  export let data;

  $: browser && toggleBodyByMode(false);
</script>

<div>
  <Home {data} />
</div>
