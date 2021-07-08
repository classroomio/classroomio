<script>
  // import
  //   border border-gray-300 rounded-md p-3 bg-blue-200 bg-opacity-25
  export let width = "max-w-3xl";
</script>

<div class="mt-4 mx-auto {width} relative pb-5">
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
  .head {
    top: 61px;
    z-index: 1;
  }
</style>
