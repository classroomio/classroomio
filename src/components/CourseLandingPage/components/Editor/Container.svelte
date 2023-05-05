<script>
  import ChevronLeft16 from 'carbon-icons-svelte/lib/ChevronLeft16';
  import ChevronRight16 from 'carbon-icons-svelte/lib/ChevronRight16';
  import { isMobile } from '../../../../utils/store/useMobile';
  import IconButton from '../../../IconButton/index.svelte';

  export let show = true;
</script>

<section
  class="root z-10 {!show && 'hide'} {$isMobile ? 'fixed shadow-xl' : 'sticky'}"
>
  {#if show}
    <div class="relative h-full bg-white dark:bg-gray-800">
      <slot />
    </div>
  {/if}

  <div class="toggler rounded-full shadow-lg absolute bottom-0">
    <IconButton
      value="toggle"
      onClick={() => (show = !show)}
      size={$isMobile ? 'large' : 'small'}
      toolTipProps={$isMobile
        ? {}
        : {
            title: 'Toggle editor',
            hotkeys: ['B'],
            direction: 'right',
          }}
    >
      {#if show}
        <ChevronLeft16 class="carbon-icon" />
      {:else}
        <ChevronRight16 class="carbon-icon" />
      {/if}
    </IconButton>
  </div>
</section>

<style lang="scss">
  .root {
    height: 100vh;
    display: flex;
    flex-direction: column;
    min-width: 300px;
    max-width: 300px;
    top: 0;
    left: 0;
    border-right: 1px solid var(--border-color);
    background-color: rgb(250, 251, 252);

    &.hide {
      min-width: 15px;
      max-width: 15px;
    }
  }

  .toggler {
    right: -15px;
    z-index: 10;
    border: 1px solid var(--border-color);
    top: 50px;
    height: fit-content;
    background: var(--border-color);
  }

  @media (max-width: 760px) {
    .root {
      width: 98%;
      min-width: unset;
      max-width: unset;
    }
  }
</style>
