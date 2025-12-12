<script lang="ts">
  import SendHorizontalIcon from '@lucide/svelte/icons/send-horizontal';
  import { IconButton } from '@cio/ui/custom/icon-button';

  let { onClick } = $props();
</script>

<IconButton onclick={onClick}>
  <SendHorizontalIcon size={16} class="filled" />
</IconButton>
