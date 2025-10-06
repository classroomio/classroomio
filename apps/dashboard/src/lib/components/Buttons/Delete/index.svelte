<script lang="ts">
  import Close from 'carbon-icons-svelte/lib/Close.svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';

  let { onClick = () => {} } = $props();
</script>

<IconButton {onClick}>
  <Close size={24} class="carbon-icon dark:text-white" title="Close" />
</IconButton>
