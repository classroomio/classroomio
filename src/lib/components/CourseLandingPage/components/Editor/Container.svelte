<script>
  import ChevronLeftIcon from 'carbon-icons-svelte/lib/ChevronLeft.svelte';
  import ChevronRightIcon from 'carbon-icons-svelte/lib/ChevronRight.svelte';
  import { isMobile } from '$lib/utils/store/useMobile';
  import IconButton from '$lib/components/IconButton/index.svelte';

  export let show = true;
</script>

<section class="root z-10">
  {#if show}
    <div class="relative h-full bg-white dark:bg-gray-800">
      <slot />
    </div>
  {/if}
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
  }
</style>
