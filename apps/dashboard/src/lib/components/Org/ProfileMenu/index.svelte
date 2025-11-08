<script>
  import Menu from './Menu.svelte';
  import Modal from '$lib/components/Modal/index.svelte';

  import { isMobile } from '$lib/utils/store/useMobile';
  import { profileMenu } from '../store';
  import { clickOutside } from '$lib/utils/functions/routes/dashboard';
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
{:else if $profileMenu.open}
  <div
    use:clickOutside
    on:click:outside={() => ($profileMenu.open = false)}
    class="absolute bottom-28 left-0 z-[300] w-full border bg-black p-2 dark:bg-white"
  >
    <Menu />
  </div>
{/if}
