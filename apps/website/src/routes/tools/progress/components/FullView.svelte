<script lang="ts">
  import Modal from '$lib/Modal/Modal.svelte';
  import Report from './Report.svelte';
  import { openModal } from './store';
</script>

<Modal bind:open={$openModal.fullscreen}>
  <!--  -->
  <Report />
  <!--  -->
</Modal>
