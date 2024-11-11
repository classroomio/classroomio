<script>
  import { run } from 'svelte/legacy';

  import { browser } from '$app/environment';
  import Home from '$lib/index.svelte';
  import { toggleBodyByMode } from '$lib/utils/toggleMode';

  /** @type {{data: any}} */
  let { data } = $props();

  run(() => {
    browser && toggleBodyByMode(false);
  });
</script>

<div>
  <Home {data} />
</div>
