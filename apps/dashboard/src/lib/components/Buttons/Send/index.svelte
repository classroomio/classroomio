<script lang="ts">
  import SendHorizontalIcon from '@lucide/svelte/icons/send-horizontal';
  import { IconButton } from '$lib/components/IconButton';

  let { onClick } = $props();
</script>

<IconButton {onClick}>
  <SendHorizontalIcon size={16} class="filled" />
</IconButton>
