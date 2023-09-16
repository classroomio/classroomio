<script>
  // import
  //   border border-gray-300 rounded-md p-3 bg-primary-200 bg-opacity-25
  export let width = 'max-w-4xl w-full lg:w-11/12';
  export let padding = 'pb-5 px-4';
  export let className = '';
  export let headerClassName = '';
</script>

<div class="root mt-4 mx-auto {width} {className} relative {padding}">
  {#if $$slots.header}
    <div
      class="head dark:bg-black flex items-center justify-between sticky right-0 w-full px-3 {headerClassName}"
    >
      <slot name="header" />
    </div>
  {/if}

  <slot />
</div>

<style>
  .root {
    overflow-y: auto;
    height: calc(100vh - 127px);
  }
  .head {
    top: 0px;
    z-index: 1;
  }
</style>
