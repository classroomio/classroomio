<script>
  import { Popover } from 'carbon-components-svelte';
  import Menu from './Menu.svelte';
  import Modal from '$lib/components/Modal/index.svelte';
  import { isMobile } from '$lib/utils/store/useMobile';
  import { profileMenu } from '../store';
</script>

{#if $isMobile}
  <Modal
    bind:open={$profileMenu.open}
    onClose={() => ($profileMenu.open = false)}
    width="w-4/5"
    containerClass="h-full !max-h-[70vh] pt-0 pb-2"
    headerClass="py-1"
  >
    <Menu />
  </Modal>
{:else}
  <Popover
    bind:open={$profileMenu.open}
    align="right-bottom"
    caret={true}
    on:click:outside={({ detail }) => {
      console.log('on:click:outside');
      $profileMenu.open = !!$profileMenu.ref?.contains(detail.target);
    }}
  >
    <Menu />
  </Popover>
{/if}
