<script lang="ts">
  import XIcon from '@lucide/svelte/icons/x';
  import { IconButton } from '$lib/components/IconButton';

  let { onClick = () => {} } = $props();
</script>

<IconButton {onClick}>
  <XIcon size={16} class="carbon-icon dark:text-white" />
</IconButton>
