<script>
  // import
  //   border border-gray-300 rounded-md p-3 bg-blue-200 bg-opacity-25
  export let width = 'max-w-3xl w-full lg:w-11/12';
  export let padding = 'pb-5 px-4';
  export let className = '';
</script>

<div class="root mt-4 mx-auto {width} {className} relative {padding}">
  {#if $$slots.header}
    <div
      class="head flex items-center justify-between sticky right-0 w-full py-3"
    >
      <slot name="header" />
    </div>
  {/if}

  <slot />
</div>

<style>
  .root {
    overflow-y: auto;
    height: 85vh;
  }
  .head {
    top: 0px;
    z-index: 1;
    background-color: #fafbfc;
  }
</style>
