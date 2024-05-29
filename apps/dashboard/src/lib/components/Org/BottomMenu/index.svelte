<script>
  import { Popover } from 'carbon-components-svelte';
  import MenuPopup from '$lib/components/Org/MenuPopup/index.svelte';
  import Modal from '$lib/components/Modal/index.svelte';
  import { isMobile } from '$lib/utils/store/useMobile';
  import { popUp } from '../store';
</script>

{#if $isMobile}
  <Modal
    bind:open={$popUp.open}
    onClose={() => ($popUp.open = false)}
    width="w-4/5"
    containerClass="h-full !max-h-[70vh] pt-0 pb-2"
    headerClass="py-1"
  >
    <MenuPopup />
  </Modal>
{:else}
  <Popover
    bind:open={$popUp.open}
    align="right-bottom"
    caret={true}
    on:click:outside={({ detail }) => {
      console.log('on:click:outside');
      $popUp.open = $popUp.ref.contains(detail.target);
    }}
  >
    <MenuPopup />
  </Popover>
{/if}
