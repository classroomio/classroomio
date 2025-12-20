<script lang="ts">
  import * as Dialog from '@cio/ui/base/dialog';
  import Report from './report.svelte';
  import { openModal } from './store';
</script>

<Dialog.Root bind:open={$openModal.fullscreen}>
  <Dialog.Content showCloseButton={false}>
    <!--  -->
    <Report />
    <!--  -->
  </Dialog.Content>
</Dialog.Root>
