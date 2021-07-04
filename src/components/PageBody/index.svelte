<script>
  // import
  //   border border-gray-300 rounded-md p-3 bg-blue-200 bg-opacity-25
</script>

<div class="root mt-4 mx-auto max-w-3xl relative pb-5">
  {#if $$slots.header}
    <div
      class="head flex bg-white items-center justify-between sticky right-0 w-full py-3"
    >
      <slot name="header" />
    </div>
  {/if}

  <slot />
</div>

<style>
  /* .root {
    max-width: 700px;
  } */

  .head {
    top: 61px;
    z-index: 1;
  }
</style>
