<script lang="ts">
  import XIcon from '@lucide/svelte/icons/x';
  import { IconButton } from '@cio/ui/custom/icon-button';

  let { onClick = () => {} } = $props();
</script>

<IconButton onclick={onClick}>
  <XIcon size={16} class="dark:text-white" />
</IconButton>
