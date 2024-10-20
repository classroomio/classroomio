<script lang="ts">
  import { embedSenjaWidget } from 'shared/src/senja';
  import { onMount } from 'svelte';

  interface Props {
    id?: string;
  }

  let { id = '' }: Props = $props();

  onMount(() => {
    embedSenjaWidget(id);
  });
</script>

<div class="senja-embed" data-id={id} data-lazyload="false" data-spinner="false"></div>
