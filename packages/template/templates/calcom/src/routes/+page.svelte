<script>
  import { run } from 'svelte/legacy';

  import { browser } from '$app/environment';
  import Home from '$lib/index.svelte';
  import { toggleBodyByMode } from '$lib/utils/toggleMode';
  let { data } = $props();

  run(() => {
    browser && toggleBodyByMode(false);
  });
</script>

<div class="font-matter">
  <Home {data} />
</div>
