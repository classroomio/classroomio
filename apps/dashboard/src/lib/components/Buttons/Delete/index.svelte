<script lang="ts">
  import XIcon from '@lucide/svelte/icons/x';
  import { IconButton } from '$lib/components/IconButton';

  let { onClick = () => {} } = $props();
</script>

<IconButton {onClick}>
  <XIcon class="carbon-icon dark:text-white" />
</IconButton>
