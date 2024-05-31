<script lang="ts">
  import Modal from './Modal.svelte';
  import Report from './Report.svelte';
  import { openModal } from './store';
</script>

{#if $openModal.fullscreen}
  <Modal
    top="top-5 md:top-[5%]"
    left="left-0 md:left-[30%]"
    width="w-full md:w-[30%] md:min-w-[500px]"
    className="h-fit"
  >
    <!--  -->
    <Report />
    <!--  -->
  </Modal>
{/if}
