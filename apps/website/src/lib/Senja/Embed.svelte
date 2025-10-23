<script lang="ts">
  import { embedSenjaWidget } from '@cio/utils/senja';
  import { onMount } from 'svelte';

  export let id = '';

  onMount(() => {
    embedSenjaWidget(id);
  });
</script>

<div class="senja-embed" data-id={id} data-lazyload="false" data-spinner="false"></div>
